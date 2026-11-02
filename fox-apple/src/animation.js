const START_X = -2.5;
const STOP_X = -0.65;

const TURN_IN_END = 0.35;
const WALK_END = 2.35;
const SETTLE_END = 2.85;
const LOWER_END = 3.75;
const BITE1_END = 4.35;
const CHEW_END = 5.15;
const BITE2_END = 5.85;
const LICK_END = 6.75;
const JUMP_END = 7.9;
const TURN_START = 7.9;
const TURN_END = 8.25;
const DURATION = 10.0;

const BITE1_MOMENT = 4.0;
const BITE2_MOMENT = 5.45;

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, u) => a + (b - a) * u;
const easeInOut = (u) => (u < 0.5 ? 2 * u * u : 1 - ((-2 * u + 2) ** 2) / 2);
const span = (t, start, end) => clamp01((t - start) / (end - start));

function headLower(t) {
  if (t < SETTLE_END) return 0;
  if (t < LOWER_END) return lerp(0, 0.8, easeInOut(span(t, SETTLE_END, LOWER_END)));
  if (t < BITE1_END) return 0.8 + Math.sin(Math.PI * span(t, LOWER_END, BITE1_END)) * 0.22;
  if (t < CHEW_END) return 0.8 + Math.sin((t - BITE1_END) * 11) * 0.05;
  if (t < BITE2_END) return 0.8 + Math.sin(Math.PI * span(t, CHEW_END, BITE2_END)) * 0.25;
  if (t < LICK_END) return lerp(0.8, 0, easeInOut(span(t, BITE2_END, LICK_END)));
  return 0;
}

function mouthOpen(t) {
  if (t >= LOWER_END && t < BITE1_END) return Math.sin(Math.PI * span(t, LOWER_END, BITE1_END)) * 0.34;
  if (t >= BITE1_END && t < CHEW_END) return Math.abs(Math.sin((t - BITE1_END) * 18)) * 0.3;
  if (t >= CHEW_END && t < BITE2_END) return Math.sin(Math.PI * span(t, CHEW_END, BITE2_END)) * 0.36;
  return 0;
}

function tongueOut(t) {
  const from = BITE2_END + 0.25;
  if (t < from || t > LICK_END) return 0;
  return Math.sin(Math.PI * span(t, from, LICK_END));
}

function blink(t) {
  for (const moment of [0.9, 2.5, 4.7, 7.15]) {
    const d = Math.abs(t - moment);
    if (d < 0.08) return 1 - d / 0.08;
  }
  return 0;
}

function biteLevel(t) {
  if (t >= BITE2_MOMENT) return 2;
  if (t >= BITE1_MOMENT) return 1;
  return 0;
}

export function createAnimation(fox, apple) {
  let time = 0;

  function apply(t) {
    const walking = (t >= TURN_IN_END && t < WALK_END) || (t >= TURN_END && t < DURATION);
    const phase = t * 13;

    if (t < TURN_IN_END) {
      fox.root.position.x = START_X;
    } else if (t < WALK_END) {
      fox.root.position.x = lerp(START_X, STOP_X, easeInOut(span(t, TURN_IN_END, WALK_END)));
    } else if (t < TURN_END) {
      fox.root.position.x = STOP_X;
    } else {
      fox.root.position.x = lerp(STOP_X, START_X, easeInOut(span(t, TURN_END, DURATION)));
    }

    if (t < TURN_IN_END) {
      fox.root.rotation.y = lerp(-Math.PI, 0, easeInOut(span(t, 0, TURN_IN_END)));
    } else if (t < TURN_START) {
      fox.root.rotation.y = 0;
    } else if (t < TURN_END) {
      fox.root.rotation.y = lerp(0, -Math.PI, easeInOut(span(t, TURN_START, TURN_END)));
    } else {
      fox.root.rotation.y = -Math.PI;
    }

    const jumping = t > LICK_END && t < JUMP_END;
    const jumpArc = jumping ? Math.sin(Math.PI * span(t, LICK_END, JUMP_END)) : 0;
    fox.root.position.y = jumpArc * 0.55;

    fox.legs.forEach((leg, index) => {
      const offset = index === 0 || index === 3 ? 0 : Math.PI;
      const amp = walking ? 0.62 : 0;
      leg.rotation.z = Math.sin(phase + offset) * amp - jumpArc * 0.5;
    });

    fox.body.position.y = 1.0 + (walking ? Math.abs(Math.sin(phase)) * 0.045 : 0);
    fox.body.rotation.z = walking ? Math.sin(phase * 2) * 0.012 : 0;

    fox.headPivot.rotation.z = -headLower(t) * 1.08;
    fox.headPivot.position.x = 0.74 + Math.min(0.07, Math.max(0, headLower(t) - 0.3) * 0.1);
    fox.jawPivot.rotation.z = -mouthOpen(t);

    const tailLift = jumping ? -0.55 : -0.14;
    fox.tailPivot.rotation.z = tailLift + Math.sin(t * 5.5) * 0.05;
    fox.tailPivot.rotation.y = Math.sin(t * 3.2) * (walking ? 0.36 : 0.18);

    const alert = t >= SETTLE_END && t < BITE2_END ? 1 : 0;
    const earTilt = jumping ? -0.12 : lerp(0.12, -0.06, alert);
    for (const ear of fox.ears) {
      ear.rotation.z = earTilt;
    }

    const lid = blink(t);
    for (const eye of fox.eyes) {
      eye.scale.y = 1 - lid * 0.9;
    }

    const lick = tongueOut(t);
    fox.tongue.scale.set(Math.max(lick, 0.001), Math.max(lick * 0.9, 0.001), Math.max(lick, 0.001));

    apple.setBite(biteLevel(t));
  }

  function update(dt) {
    const previous = time;
    time += dt;
    let wrapped = false;
    if (time >= DURATION) {
      time %= DURATION;
      wrapped = true;
    }

    if (wrapped) {
      apple.reset();
      apple.setBite(biteLevel(time));
    } else {
      if (previous < BITE1_MOMENT && time >= BITE1_MOMENT) apple.burst();
      if (previous < BITE2_MOMENT && time >= BITE2_MOMENT) apple.burst();
    }

    apply(time);
    apple.update(dt);
  }

  function seek(t) {
    time = ((t % DURATION) + DURATION) % DURATION;
    apple.reset();
    apple.setBite(biteLevel(time));
    apply(time);
  }

  function reset() {
    time = 0;
    apple.reset();
    apply(0);
  }

  apply(0);

  return {
    update,
    seek,
    reset,
    get time() { return time; },
    get duration() { return DURATION; },
  };
}
