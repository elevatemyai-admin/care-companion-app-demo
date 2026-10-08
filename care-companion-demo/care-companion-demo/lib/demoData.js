// All names, entries, and conversations in this file are made up for demo purposes.
// Dates are generated relative to today so the demo always looks current.

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dateDaysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
}

function hhmm(totalMinutes) {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function nowHHMM() {
  return new Date().toTimeString().slice(0, 5);
}

const TEMPLATES = {
  "Mood & Behavior": {
    window: [16 * 60 + 30, 19 * 60 + 45],
    notes: [
      "Got restless around dinner and kept asking when we were going home.",
      "Agitated after the evening news came on. Paced the hallway for a while.",
      "Snapped at me when I helped him get ready for bed.",
      "Anxious and following me from room to room.",
      "Became upset when I turned on the lights. Calmed down after some quiet music."
    ]
  },
  "Wandering": {
    window: [17 * 60, 19 * 60 + 30],
    notes: [
      "Went to the front door twice trying to leave for work.",
      "Found him in the garage at dusk saying he needed to go home.",
      "Kept checking the back gate. Walked with him until he settled."
    ]
  },
  "Memory & Confusion": {
    window: [10 * 60, 19 * 60],
    notes: [
      "Asked twice who was coming to visit.",
      "Couldn't remember the word for the remote and got frustrated.",
      "Forgot what day it was and was worried he missed an appointment.",
      "Looked for his glasses for 20 minutes. They were on his head."
    ]
  },
  "Sleep": {
    window: [60, 3 * 60 + 30],
    notes: [
      "Up at 2am looking for his keys.",
      "Awake most of the night and dozed in the chair around noon.",
      "Got dressed at 3am thinking it was morning."
    ]
  },
  "Eating & Appetite": {
    window: [12 * 60, 13 * 60 + 30],
    notes: [
      "Pushed his plate away and only ate a few bites.",
      "Ate well at breakfast but almost nothing at dinner."
    ]
  },
  "Communication": {
    window: [11 * 60, 18 * 60],
    notes: [
      "Trouble finding words at dinner and got frustrated.",
      "Started a sentence and lost the thread halfway through."
    ]
  },
  "Mobility & Falls": {
    window: [7 * 60 + 30, 10 * 60],
    notes: [
      "Unsteady getting out of the chair. Caught himself on the counter.",
      "Shuffling more than usual this morning."
    ]
  },
  "Medication Reaction": {
    window: [21 * 60, 22 * 60],
    notes: ["Seemed a little nauseous an hour after the evening dose."],
    meds: "Memantine 10mg, 8pm"
  }
};

function buildSymptoms() {
  const r = mulberry32(2026);
  const DAYS = 28;
  const entries = [];
  let n = 0;
  const maybe = (p) => r() < p;

  for (let i = 0; i < DAYS; i++) {
    const daysAgo = DAYS - i; // 28 ... 1 (no entries for today)
    const progress = i / (DAYS - 1);
    const date = dateDaysAgo(daysAgo);

    const plan = [
      ["Mood & Behavior", 0.78],
      ["Wandering", 0.15 + 0.35 * progress],
      ["Memory & Confusion", 0.5],
      ["Sleep", 0.25 + 0.3 * progress],
      ["Eating & Appetite", 0.22],
      ["Communication", 0.18],
      ["Mobility & Falls", 0.05 + 0.08 * progress],
      ["Medication Reaction", 0.03]
    ];

    plan.forEach(([cat, prob]) => {
      if (!maybe(prob)) return;
      const t = TEMPLATES[cat];
      const minute = Math.round(t.window[0] + r() * (t.window[1] - t.window[0]));
      let severity = 1 + progress * 1.6 + r() * 1.4 + (cat === "Wandering" ? 0.8 : 0);
      severity = Math.max(1, Math.min(5, Math.round(severity)));
      entries.push({
        id: `demo-sym-${n++}`,
        date,
        time: hhmm(minute),
        category: cat,
        severity,
        notes: t.notes[Math.floor(r() * t.notes.length)],
        meds: t.meds || "",
        loggedAt: `${date}T${hhmm(minute)}:00`
      });
    });
  }
  return entries.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

function buildMeds() {
  return [
    { id: "demo-med-1", name: "Memantine", dose: "10mg", times: ["08:00", "20:00"], notes: "With food", active: true },
    { id: "demo-med-2", name: "Donepezil", dose: "10mg", times: ["20:00"], notes: "", active: true },
    { id: "demo-med-3", name: "Vitamin D", dose: "1000 IU", times: ["08:00"], notes: "", active: true }
  ];
}

function buildMedLog(meds) {
  const r = mulberry32(77);
  const log = [];
  let n = 0;
  for (let d = 7; d >= 1; d--) {
    const date = dateDaysAgo(d);
    meds.forEach((m) => m.times.forEach((time) => {
      if (r() < 0.1) return; // an occasional missed dose keeps it realistic
      log.push({ id: `demo-log-${n++}`, medId: m.id, date, time, taken: true, takenAt: `${date}T${time}:00` });
    }));
  }
  const today = dateDaysAgo(0);
  const now = nowHHMM();
  meds.forEach((m) => m.times.forEach((time) => {
    if (time <= now) log.push({ id: `demo-log-${n++}`, medId: m.id, date: today, time, taken: true, takenAt: `${today}T${time}:00` });
  }));
  return log;
}

function buildVent() {
  const at = (daysAgo, time) => `${dateDaysAgo(daysAgo)}T${time}:00`;
  return [
    {
      id: "demo-vent-1", date: at(13, "08:10"), mood: "Hopeful",
      text: "Good morning. We did the crossword together and he got three answers. Holding onto that today."
    },
    {
      id: "demo-vent-2", date: at(10, "17:45"), mood: "Sad",
      text: "He called me by my sister's name today. I laughed it off. I cried in the car afterward."
    },
    {
      id: "demo-vent-3", date: at(6, "20:30"), mood: "Overwhelmed",
      text: "Everyone keeps asking how he's doing. Nobody asks how I'm doing, and I don't even know how I'd answer."
    },
    {
      id: "demo-vent-4", date: at(3, "21:40"), mood: "Exhausted",
      text: "He was up three times last night. I'm running on fumes and I feel guilty for being short with him. I know it isn't his fault."
    }
  ];
}

const SEED_ADVICE = [
  { role: "user", content: "He gets so restless around 5pm and keeps trying to leave. What can I do?" },
  {
    role: "assistant",
    content:
      "What you're describing is common in the late afternoon and early evening, and it's often called sundowning. It's exhausting, and it doesn't mean you're doing anything wrong.\n\nA few things families often find helpful:\n\nKeep the late afternoon calm. Turn on lights before it gets dim, close the curtains as dusk arrives, and keep the TV and noise low.\n\nGive him something to do around 4pm, like folding towels, sorting a drawer, or a short walk together. A simple job can settle that restless energy.\n\nIf he says he needs to go home, try joining him rather than correcting him. Ask about home, and gently steer toward a cup of tea or a snack.\n\nI'd also mention this pattern to his doctor, especially since your log shows it clustering in the evening. They can check for things that make it worse, like medication timing or sleep. And if he ever gets out of the house, call for help right away."
  }
];

export function buildSeed() {
  const meds = buildMeds();
  return {
    profile: { her: "Gidget", him: "Frankee" },
    "vent-entries": buildVent(),
    "symptom-entries": buildSymptoms(),
    "advice-messages": SEED_ADVICE,
    medications: meds,
    "med-log": buildMedLog(meds)
  };
}

const REPLIES = [
  {
    test: /sleep|night|awake|3am|2am|bed/i,
    text:
      "Broken nights wear everyone down, and it's very common with dementia.\n\nA few ideas to try: keep the same bedtime routine every night, get him some daylight and a walk in the morning, and cut back on naps after lunch. A small night light in the hall and bathroom can help if he wakes up disoriented.\n\nIf he gets up, try gently walking him back to bed rather than arguing about the time.\n\nSince this is affecting you too, it's worth bringing up with his doctor. There may be things to adjust, and I'd rather you not just push through it alone."
  },
  {
    test: /eat|food|appetite|dinner|lunch|meal/i,
    text:
      "Appetite changes are really common. Some things that sometimes help: smaller portions on a plain plate, finger foods he can pick up easily, and serving the biggest meal at the time of day he's hungriest, which for many people is earlier in the day.\n\nTry sitting down and eating with him, since that often encourages him to eat too.\n\nIf you notice weight loss, trouble swallowing, or coughing while eating, please let his doctor know soon."
  },
  {
    test: /angry|agitat|yell|snap|upset|aggress|hit/i,
    text:
      "That sounds really hard, and I'm glad you're thinking it through rather than taking it personally.\n\nWhen he's upset, a calm, low voice usually works better than explaining or correcting. Try to figure out what came right before, like noise, pain, being rushed, or being hungry or tired, and note it in your log so you can spot a pattern.\n\nIf you ever feel unsafe, step away to a safe room and call for help. And please tell his doctor about any increase in agitation, since there can be treatable causes."
  },
  {
    test: /doctor|medic|dose|pill|prescri/i,
    text:
      "This is one for his care team. I can't advise on medications or doses, and changes to them should always come from his doctor or pharmacist.\n\nWhat I can help with is getting ready for the visit. Your Reports tab can pull together the last few weeks of symptoms, including the times of day, so the doctor sees the full picture instead of relying on memory."
  }
];

const FALLBACK =
  "Thank you for telling me about that. It sounds like a lot to carry.\n\nIn general, it helps to keep routines steady, keep things calm and simple, and respond to the feeling behind what he's saying rather than the facts. Logging it in Symptoms will also help you and his doctor spot patterns over time.\n\nIf you tell me a bit more about when it happens and what usually comes right before, I can offer more specific ideas.";

export function demoReply(question) {
  const match = REPLIES.find((r) => r.test.test(question));
  return match ? match.text : FALLBACK;
}
