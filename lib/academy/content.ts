/**
 * lib/academy/content.ts — CosmoAcademy static lesson content
 *
 * All quiz questions, answers, and explanations live here.
 * The server re-validates correct answers on submission — the
 * correctIndex being in the client bundle is intentional for
 * immediate per-question feedback UX.
 *
 * Lesson levels and unlock chain:
 *   Level 1 → always unlocked
 *   Level 2 → unlock after completing any Level 1 lesson
 *   Level 3 → unlock after completing any Level 2 lesson
 *   Level 4 → unlock after completing any Level 3 lesson
 */

import type { LessonTopic } from '@prisma/client';

// ─── types ───────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  id:           string;
  question:     string;
  options:      string[];   // exactly 4
  correctIndex: number;     // 0-based index into options
  explanation:  string;
}

export interface LessonContent {
  slug:           string;
  title:          string;
  description:    string;
  topic:          LessonTopic;
  level:          number;
  emoji:          string;
  stardustReward: number;
  questions:      QuizQuestion[];
}

// ─── lessons ─────────────────────────────────────────────────────────────────

export const LESSONS: LessonContent[] = [

  // ── Level 1 ───────────────────────────────────────────────────────────────

  {
    slug:           'foundations',
    title:          'The Zodiac Wheel',
    description:    'Learn the 12 signs, their elements, modalities, and ruling planets.',
    topic:          'FOUNDATIONS',
    level:          1,
    emoji:          '🌐',
    stardustReward: 50,
    questions: [
      {
        id:           'f-1',
        question:     'Which element does Aries belong to?',
        options:      ['Earth', 'Fire', 'Water', 'Air'],
        correctIndex: 1,
        explanation:  'Aries is a Fire sign — passionate, direct, and full of initiative. The Fire signs are Aries, Leo, and Sagittarius.',
      },
      {
        id:           'f-2',
        question:     'How many signs are in the Western zodiac?',
        options:      ['10', '9', '12', '8'],
        correctIndex: 2,
        explanation:  'The Western zodiac has 12 signs, each spanning exactly 30° of the ecliptic circle.',
      },
      {
        id:           'f-3',
        question:     'Taurus is which modality?',
        options:      ['Cardinal', 'Fixed', 'Mutable', 'Angular'],
        correctIndex: 1,
        explanation:  'Taurus is a Fixed sign — stable, persistent, and resistant to change. Fixed signs consolidate the energy begun by Cardinal signs.',
      },
      {
        id:           'f-4',
        question:     'Gemini is ruled by which planet?',
        options:      ['Venus', 'Mercury', 'Mars', 'Jupiter'],
        correctIndex: 1,
        explanation:  'Mercury governs Gemini (and Virgo). It rules communication, intellect, language, and short travel.',
      },
      {
        id:           'f-5',
        question:     'Which of these is a Water sign?',
        options:      ['Libra', 'Sagittarius', 'Virgo', 'Scorpio'],
        correctIndex: 3,
        explanation:  'Scorpio belongs to the Water element, along with Cancer and Pisces. Water signs are associated with emotion, intuition, and depth.',
      },
    ],
  },

  // ── Level 2 ───────────────────────────────────────────────────────────────

  {
    slug:           'planetary-dignities',
    title:          'Planetary Dignities',
    description:    'Master rulerships, exaltations, falls, and detriments — the strength ratings of planets.',
    topic:          'PLANETARY_DIGNITIES',
    level:          2,
    emoji:          '♄',
    stardustReward: 100,
    questions: [
      {
        id:           'pd-1',
        question:     'Which planet is exalted in Aries?',
        options:      ['Venus', 'Sun', 'Moon', 'Saturn'],
        correctIndex: 1,
        explanation:  'The Sun is exalted in Aries (exactly at 19° Aries). In Aries the Sun expresses its most direct, confident, and vital self.',
      },
      {
        id:           'pd-2',
        question:     'Which planet rules Scorpio in traditional astrology?',
        options:      ['Pluto', 'Mars', 'Saturn', 'Uranus'],
        correctIndex: 1,
        explanation:  'In traditional astrology, Mars rules both Aries and Scorpio. Modern astrology assigns Pluto as Scorpio\'s co-ruler.',
      },
      {
        id:           'pd-3',
        question:     'A planet in "detriment" occupies the sign:',
        options:      ['It rules', 'It is exalted in', 'Opposite its home sign', 'It falls in'],
        correctIndex: 2,
        explanation:  'Detriment = the sign directly opposite the one a planet rules. Here the planet\'s energy is at odds with the sign\'s nature, creating friction.',
      },
      {
        id:           'pd-4',
        question:     'Venus is exalted in which sign?',
        options:      ['Taurus', 'Libra', 'Pisces', 'Cancer'],
        correctIndex: 2,
        explanation:  'Venus in Pisces (at 27°) expresses love, beauty, and compassion at their most transcendent and selfless.',
      },
      {
        id:           'pd-5',
        question:     'Saturn is in its "fall" in which sign?',
        options:      ['Aries', 'Cancer', 'Libra', 'Capricorn'],
        correctIndex: 0,
        explanation:  'Saturn\'s fall is Aries — opposite its exaltation in Libra. In Aries, Saturn\'s discipline and patience struggle against impulsive Aries energy.',
      },
    ],
  },

  {
    slug:           'the-12-houses',
    title:          'The 12 Houses',
    description:    'Understand the life domains each house governs and how planets express through them.',
    topic:          'THE_12_HOUSES',
    level:          2,
    emoji:          '🏛️',
    stardustReward: 100,
    questions: [
      {
        id:           'h-1',
        question:     'The 1st house primarily governs:',
        options:      ['Partnerships', 'Self, appearance, and identity', 'Personal finances', 'Home and family'],
        correctIndex: 1,
        explanation:  'The 1st house (Ascendant) represents the self — your physical appearance, first impressions, and how you present to the world.',
      },
      {
        id:           'h-2',
        question:     'Which house is associated with career and public reputation?',
        options:      ['6th', '8th', '10th', '11th'],
        correctIndex: 2,
        explanation:  'The 10th house (Midheaven) governs career, public standing, ambitions, and your relationship with authority.',
      },
      {
        id:           'h-3',
        question:     'The 7th house primarily governs:',
        options:      ['Hidden enemies', 'Long-distance travel', 'Partnerships and marriage', 'Shared resources'],
        correctIndex: 2,
        explanation:  'The 7th house rules all one-on-one partnerships — romantic, business, and legal — as well as open enemies.',
      },
      {
        id:           'h-4',
        question:     'The 8th house is most associated with:',
        options:      ['Creativity and romance', 'Transformation and shared resources', 'Daily work routines', 'Philosophy and higher learning'],
        correctIndex: 1,
        explanation:  'The 8th house rules death, rebirth, transformation, other people\'s money, inheritance, and deep psychological change.',
      },
      {
        id:           'h-5',
        question:     'Which house rules friendships, groups, and collective hopes?',
        options:      ['3rd', '7th', '9th', '11th'],
        correctIndex: 3,
        explanation:  'The 11th house governs friendships, social circles, humanitarian causes, and the hopes and wishes you hold for the future.',
      },
    ],
  },

  // ── Level 3 ───────────────────────────────────────────────────────────────

  {
    slug:           'aspects',
    title:          'Aspects',
    description:    'Decode the angular relationships between planets and what they mean for your chart.',
    topic:          'ASPECTS',
    level:          3,
    emoji:          '△',
    stardustReward: 150,
    questions: [
      {
        id:           'a-1',
        question:     'A trine is an aspect of how many degrees?',
        options:      ['60°', '90°', '120°', '180°'],
        correctIndex: 2,
        explanation:  'A trine (△) is 120°. It connects planets of the same element and is considered the most harmonious major aspect — easy flow, natural talent.',
      },
      {
        id:           'a-2',
        question:     'Which major aspect is most associated with dynamic tension?',
        options:      ['Trine', 'Sextile', 'Square', 'Conjunction'],
        correctIndex: 2,
        explanation:  'The square (□) is 90°. It creates friction and challenge between two planets — a powerful driver of growth when worked with consciously.',
      },
      {
        id:           'a-3',
        question:     'An opposition spans how many degrees?',
        options:      ['120°', '150°', '180°', '90°'],
        correctIndex: 2,
        explanation:  'An opposition (☍) is 180°. Planets face each other across the chart, creating polarity and the need for integration or projection.',
      },
      {
        id:           'a-4',
        question:     'What does "orb" mean in the context of aspects?',
        options:      [
          'A planetary body in the solar system',
          'The allowable deviation from an exact aspect angle',
          'A house division technique',
          'The ayanamsa correction value',
        ],
        correctIndex: 1,
        explanation:  'The orb is the degrees of tolerance around an exact aspect. A tighter orb (smaller number) indicates a stronger, more precise aspect.',
      },
      {
        id:           'a-5',
        question:     'A sextile aspect is:',
        options:      ['45°', '60°', '72°', '90°'],
        correctIndex: 1,
        explanation:  'A sextile (⚹) is 60°. It connects planets two signs apart and represents opportunity, ease of cooperation, and supportive energy.',
      },
    ],
  },

  {
    slug:           'vedic-basics',
    title:          'Vedic Basics',
    description:    'Discover Jyotish — the sidereal zodiac, Nakshatras, Ayanamsa, and Whole Sign houses.',
    topic:          'VEDIC_BASICS',
    level:          3,
    emoji:          '🕉️',
    stardustReward: 150,
    questions: [
      {
        id:           'v-1',
        question:     'The Vedic zodiac is based on which system?',
        options:      ['Tropical zodiac', 'Sidereal zodiac', 'Heliocentric zodiac', 'Equal house system'],
        correctIndex: 1,
        explanation:  'Vedic (Jyotish) astrology uses the sidereal zodiac, which is aligned to the actual star constellations rather than the seasons.',
      },
      {
        id:           'v-2',
        question:     'What does "Ayanamsa" refer to?',
        options:      [
          'A Vedic house system',
          'The angular offset between tropical and sidereal zodiacs due to precession',
          'A planetary dignity in Vedic astrology',
          'A type of Vedic lunar mansion',
        ],
        correctIndex: 1,
        explanation:  'Ayanamsa is the ever-increasing angular gap caused by Earth\'s axial precession (~50" per year). The Lahiri Ayanamsa is the most widely used standard.',
      },
      {
        id:           'v-3',
        question:     'How many Nakshatras (lunar mansions) does Vedic astrology use?',
        options:      ['12', '18', '27', '36'],
        correctIndex: 2,
        explanation:  'Jyotish uses 27 Nakshatras, each spanning 13°20\'. They track the Moon\'s daily journey through the sky and are central to compatibility and timing.',
      },
      {
        id:           'v-4',
        question:     'The Lahiri Ayanamsa at epoch J2000.0 is approximately:',
        options:      ['18°', '21°', '24°', '27°'],
        correctIndex: 2,
        explanation:  'The Lahiri Ayanamsa at J2000.0 is ~23.85° (≈ 24°). This means Vedic signs are about 24° behind their tropical counterparts in 2000.',
      },
      {
        id:           'v-5',
        question:     'In Whole Sign houses (the Vedic standard), each house is:',
        options:      ['30° exactly from the Ascendant degree', 'Divided by the Midheaven', 'One entire zodiac sign', 'Based on local latitude'],
        correctIndex: 2,
        explanation:  'In Whole Sign houses, House 1 = the entire sign of the Ascendant, House 2 = the next sign, and so on — clean, sign-based boundaries.',
      },
    ],
  },

  // ── Level 4 ───────────────────────────────────────────────────────────────

  {
    slug:           'synastry',
    title:          'Synastry',
    description:    'Learn how two charts interact — aspects, overlays, and the Vedic Guna Milan system.',
    topic:          'SYNASTRY',
    level:          4,
    emoji:          '💫',
    stardustReward: 200,
    questions: [
      {
        id:           's-1',
        question:     'Synastry is the practice of:',
        options:      [
          'Reading a single natal chart in depth',
          'Comparing two birth charts for compatibility',
          'Predicting future events via progressions',
          'Calculating solar returns',
        ],
        correctIndex: 1,
        explanation:  'Synastry overlays one person\'s chart onto another\'s to examine how their planetary energies interact — the foundation of relationship astrology.',
      },
      {
        id:           's-2',
        question:     'In Western synastry, which inter-chart aspect most strongly suggests magnetic attraction?',
        options:      ['Saturn □ Saturn', 'Venus ☌ Mars', 'Moon ☍ Moon', 'Sun △ Saturn'],
        correctIndex: 1,
        explanation:  'Venus conjunct Mars between two charts is the classic indicator of powerful attraction — receptive Venus meets assertive Mars across the charts.',
      },
      {
        id:           's-3',
        question:     'The Vedic compatibility scoring system based on 36 total points is called:',
        options:      ['Dasha system', 'Navamsa', 'Guna Milan (Ashtakoot)', 'Kuja Dosha'],
        correctIndex: 2,
        explanation:  'Guna Milan (Ashtakoot) matches eight qualities (Gunas) between prospective partners. 18+ points is considered compatible; 36 is a perfect match.',
      },
      {
        id:           's-4',
        question:     'If Person A\'s Moon is conjunct Person B\'s Sun in synastry, this typically indicates:',
        options:      ['Financial tension', 'Communication barriers', 'Deep emotional resonance', 'Creative rivalry'],
        correctIndex: 2,
        explanation:  'Moon-Sun conjunction in synastry is one of the most potent bonding aspects — the Moon person feels emotionally seen; the Sun person feels nurtured.',
      },
      {
        id:           's-5',
        question:     'A "double whammy" aspect in synastry means:',
        options:      [
          'Two squares present between the charts',
          'The same aspect appears in both directions simultaneously',
          'Both people have the same Rising sign',
          'Both charts share the same Moon sign',
        ],
        correctIndex: 1,
        explanation:  'A double whammy is when an aspect repeats mutually — e.g., A\'s Venus trines B\'s Sun AND B\'s Venus trines A\'s Sun — amplifying its significance.',
      },
    ],
  },
];

// ─── lookup helpers ───────────────────────────────────────────────────────────

export const LESSON_BY_SLUG = new Map(LESSONS.map((l) => [l.slug, l]));

/** Returns the lesson content for a DB lesson slug, or null if not found. */
export function getLessonContent(slug: string): LessonContent | undefined {
  return LESSON_BY_SLUG.get(slug);
}
