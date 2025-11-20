# Llama Assembly Coach 🪛

## 1. One-liner & Angle for the Judges

**Product name:** Llama Assembly Coach 🪛

**Pitch:** "Upload any assembly or repair manual, and Llama + vision turn it into interactive, step-by-step visual and voice guidance that checks your work in real time."

### Key Angles

- **Manufacturing DX:** Same pipeline can be used for SOPs, repair workflows, maintenance training
- **Social Impact:** Helps people who struggle with complex manuals (language, literacy, cognitive load)
- **Llama-centric:** Llama is clearly the brain orchestrating manuals, steps, and validation; SAM/DINO are tools

---

## 2. End-to-End User Flow (Demo Scenario)

Use a concrete IKEA-ish example in the pitch:

### Step 1: Upload Manual
User uploads a manual (PDF / photos of pages)

### Step 2: System Parsing
**Llama reads text + (optionally) captions from images:**
- Produces structured steps + completion criteria

### Step 3: Component Detection
User aims camera at box / laid-out components

**Llama + vision:**
- If parts still boxed → "Please open the box and lay out all parts so I can check them"
- SAM segments objects; DINO matches each segment to "A, B, C…" from the manual
- Overlay labels on screen: A: tabletop, B: leg, C: screws, etc.

### Step 4: Guided Assembly

**User:** "What do I do first?"

**Llama:** "Step 1: Take A (tabletop) and four B (legs). Place A face down and arrange B at each corner."

User does the step, shows the result (photo / live frame)

### Step 5: Validation

Vision summarizes state (e.g. detected 4 legs attached, approximate positions)

**Llama compares against the step's completion criteria:**
- If OK → "Nice, step 1 complete. Ready for step 2?"
- If wrong → "One leg is missing / misaligned. Let's fix that."

**Loop until all steps completed.**

> **Note:** AR overlays are a stretch goal: you can already wow them with 2D bounding boxes + labels

---

## 3. Core Components / Architecture

### 3.1 Manual Ingestion & Structuring (Llama-heavy bit)

**Input:** PDF or images of manual pages

**Preprocess:**
- If images/PDF: run OCR (even basic, or pre-bake one manual for hackathon)
- Extract:
  - Step numbers / headings
  - Step text
  - Associated diagrams (optional)

**Llama Task 1 – "Manual → Structured Plan"**

Prompt Llama with the raw text (and maybe brief descriptions of images) and ask it to output JSON like:

```json
{
  "project_name": "IKEA LACK Table",
  "components": [
    {
      "id": "A",
      "name": "Tabletop",
      "qty": 1,
      "description": "flat board with pre-drilled holes"
    },
    {
      "id": "B",
      "name": "Leg",
      "qty": 4,
      "description": "hollow square tube"
    },
    {
      "id": "C",
      "name": "Screw",
      "qty": 8,
      "description": "short silver screw"
    }
  ],
  "steps": [
    {
      "step_id": 1,
      "title": "Attach the legs",
      "instructions": [
        "Place tabletop A upside-down on a soft surface.",
        "Position legs B at each corner, lining up the holes.",
        "Use 2 screws C per leg to fasten."
      ],
      "completion_criteria": [
        "Exactly 4 legs B attached to A.",
        "Each leg is fixed with 2 screws C.",
        "All legs oriented with open side facing inwards."
      ]
    }
  ]
}
```

That `completion_criteria` is what you'll later use to judge "done / not done".

---

### 3.2 Vision: Component Detection & Labelling (SAM + DINO)

When user lays out all parts:

1. **Capture image from camera**

2. **SAM / SAM 3:**
   - Segment the image into object regions (masks or bounding boxes)

3. **DINOv3:**
   - Compute an embedding per region
   - Compute embedding for each reference component:
     - Either from small cropped images from the manual, or
     - From a few example photos you prepare
   - Nearest-neighbour matching → guess which region is A, B, C…

**Output to Llama:**

```json
{
  "scene_components": [
    {
      "region_id": 1,
      "label": "A?",
      "candidate_ids": ["A"],
      "confidence": 0.92
    },
    {
      "region_id": 2,
      "label": "B?",
      "candidate_ids": ["B"],
      "confidence": 0.88
    },
    {
      "region_id": 3,
      "label": "C?",
      "candidate_ids": ["C"],
      "confidence": 0.81
    }
  ],
  "missing_expected_components": ["B"],
  "counts": {
    "A": 1,
    "B": 3,
    "C": 8
  }
}
```

**Llama's Role:**
- Resolve ambiguities ("I think these are legs B, but I only see 3, the manual expects 4")
- Talk to user ("I see 3 legs – is one still in the box?")
- Decide whether to proceed to step 1 or ask user to re-layout

---

### 3.3 Step Execution & Checking Loop (State Machine)

Each step has states like:
- `LAYOUT_VERIFIED`
- `GUIDANCE_GIVEN`
- `AWAIT_USER_ACTION`
- `STEP_VALIDATION`
- `STEP_COMPLETE` or `STEP_ERROR`

**Validation Frame:**

After user claims they've completed a step, they hit a button / say "check"

1. Capture a new image
2. Vision pipeline again:
   - Segment + match components
   - Optionally compute simple geometric features:
     - How many legs are touching tabletop?
     - Approx. positions (corners vs random)

3. Summarise into a compact `scene_state`:

```json
{
  "step_id": 1,
  "detected": {
    "A": {"present": true},
    "B": {
      "attached_to_A": 4,
      "positions": "corner_like"
    },
    "C": {"used_count": 8}
  },
  "notable_issues": [
    "leg_2_tilted",
    "one_screw_missing_on_leg_3"
  ]
}
```

**Llama Task 2 – "Evaluator"**

Given:
- The `completion_criteria` from the structured manual
- This `scene_state`

Ask Llama to output:

```json
{
  "step_id": 1,
  "status": "pass" | "fail" | "uncertain",
  "feedback": "Human-friendly explanation here.",
  "next_action": "advance" | "request_rework" | "ask_for_closeup"
}
```

**Then you:**
- If pass → move to next step
- If fail → voice + text feedback and let the user try again
- If uncertain → ask for a closer photo of an area ("Show me the front left corner")

---

### 3.4 Voice Interaction (Nice but Optional)

**Simple loop:**

1. **ASR:** user speech → text

2. **You always send to Llama:**
   - `user_utterance`
   - Current step, state, and latest vision summary

3. **Llama decides:**
   - Are they asking "what's next?", "did I do it right?", or "I'm stuck"?
   - Returns both:
     - `assistant_text` (for TTS)
     - `intent` (e.g. "check_step", "explain_step", "advance")

This gives you a nice "voice coach" feeling without complex NLU.

---

## 4. MVP vs Stretch for Hackathon

### Bare-bones MVP (Still Very Impressive)

**Manual:**
- Hardcode one IKEA-style example manual (you can pre-OCR it)

**Llama:**
- Takes that text and builds the JSON steps
- Guides the user step-by-step in text (and optionally voice)

**Vision:**
- Use SAM + DINO to:
  - Label 2–3 distinct part types on the floor
  - Check a very simple condition per step (e.g. "are all 4 legs attached?")

**UI:**
- Web app:
  - Area showing current step text
  - Camera view with bounding boxes + "A/B/C" labels
  - Buttons: "Scan parts", "Check step", "Next step"

**That's enough for a killer demo.**

---

### Stretch Goals (If Time Allows)

- AR-style overlay in browser (WebAR / AR.js / just canvas overlays that follow the bounding boxes)
- Multi-step error detection (wrong part in wrong place)
- Multi-language guidance (JP/EN)
- Use a real IKEA manual and show before/after: confusing page vs clear Llama guidance

---

## 5. How to Pitch It in 20–30 Seconds

**Sample pitch:**

> "We built **Llama Assembly Coach**, a system that turns any assembly or repair manual into an interactive AR-like guide. You upload the manual, Llama understands and restructures it into clean, step-by-step instructions with clear pass/fail criteria. Then, using SAM and DINO, we label all your parts on the floor — screws, boards, brackets — according to the manual (A, B, C…).
> 
> You point your camera while you build. At each step, Llama tells you what to pick up and what to do, then checks your work visually and gives feedback. If it's wrong, it tells you exactly what to fix; if it's right, you move on.
> 
> The same pipeline can be used for factory maintenance, assembly training, and repair SOPs — and it all runs on open models: Llama plus open-source vision."

---

## Summary

This project showcases:
- **Llama's reasoning and orchestration** for parsing manuals and guiding users
- **Computer vision (SAM + DINO)** for real-world object detection and validation
- **Practical impact** for accessibility, manufacturing, and training
- **Scalability** beyond just IKEA furniture to industrial and educational applications
