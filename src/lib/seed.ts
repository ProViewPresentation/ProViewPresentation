import type { ServiceItem, Song, WorkspaceData, Slide } from './types';
import { makeSlides } from './utils';

export const sampleSongs: Song[] = [
  {
    id: 'song-amazing-grace',
    title: 'Amazing Grace',
    author: 'John Newton',
    copyright: 'Public domain',
    ccli: '',
    tags: ['Grace', 'Hymn'],
    lyrics:
      'Amazing grace! How sweet the sound\nThat saved a wretch like me!\nI once was lost, but now am found;\nWas blind, but now I see.\n\n’Twas grace that taught my heart to fear,\nAnd grace my fears relieved;\nHow precious did that grace appear\nThe hour I first believed!\n\nThrough many dangers, toils and snares,\nI have already come;\n’Tis grace hath brought me safe thus far,\nAnd grace will lead me home.',
  },
  {
    id: 'song-be-thou',
    title: 'Be Thou My Vision',
    author: 'Mary E. Byrne / Eleanor H. Hull',
    copyright: 'Public domain',
    ccli: '',
    tags: ['Worship', 'Hymn'],
    lyrics:
      'Be Thou my vision, O Lord of my heart;\nNaught be all else to me, save that Thou art.\nThou my best thought, by day or by night,\nWaking or sleeping, Thy presence my light.\n\nBe Thou my wisdom, and Thou my true word;\nI ever with Thee and Thou with me, Lord;\nThou my great Father, I Thy true son;\nThou in me dwelling, and I with Thee one.',
  },
  {
    id: 'song-doxology',
    title: 'Doxology',
    author: 'Thomas Ken',
    copyright: 'Public domain',
    ccli: '',
    tags: ['Praise', 'Hymn'],
    lyrics:
      'Praise God, from whom all blessings flow;\nPraise Him, all creatures here below;\nPraise Him above, ye heavenly host;\nPraise Father, Son, and Holy Ghost.',
  },
  {
    id: 'song-holy',
    title: 'Holy, Holy, Holy',
    author: 'Reginald Heber',
    copyright: 'Public domain',
    ccli: '',
    tags: ['Worship', 'Hymn'],
    lyrics:
      'Holy, holy, holy! Lord God Almighty!\nEarly in the morning our song shall rise to Thee;\nHoly, holy, holy, merciful and mighty!\nGod in three persons, blessed Trinity!\n\nHoly, holy, holy! All the saints adore Thee,\nCasting down their golden crowns around the glassy sea;\nCherubim and seraphim falling down before Thee,\nWhich wert, and art, and evermore shalt be.',
  },
];

export const scripturePassages = [
  {
    reference: 'Psalm 23:1–6',
    search: 'psalm psalms 23 1-6',
    text: 'The LORD is my shepherd; I shall not want.\n\nHe maketh me to lie down in green pastures: he leadeth me beside the still waters.\n\nHe restoreth my soul: he leadeth me in the paths of righteousness for his name’s sake.\n\nYea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.\n\nThou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.\n\nSurely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.',
  },
  {
    reference: 'John 3:16–17',
    search: 'john 3 16-17',
    text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.\n\nFor God sent not his Son into the world to condemn the world; but that the world through him might be saved.',
  },
  {
    reference: 'Philippians 4:6–7',
    search: 'philippians phil 4 6-7',
    text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.\n\nAnd the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.',
  },
  {
    reference: 'Psalm 100:1–5',
    search: 'psalm psalms 100 1-5',
    text: 'Make a joyful noise unto the LORD, all ye lands.\n\nServe the LORD with gladness: come before his presence with singing.\n\nKnow ye that the LORD he is God: it is he that hath made us, and not we ourselves; we are his people, and the sheep of his pasture.\n\nEnter into his gates with thanksgiving, and into his courts with praise: be thankful unto him, and bless his name.\n\nFor the LORD is good; his mercy is everlasting; and his truth endureth to all generations.',
  },
  {
    reference: 'Matthew 11:28–30',
    search: 'matthew matt 11 28-30',
    text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.\n\nTake my yoke upon you, and learn of me; for I am meek and lowly in heart: and ye shall find rest unto your souls.\n\nFor my yoke is easy, and my burden is light.',
  },
  {
    reference: '1 Corinthians 13:4–7',
    search: '1 corinthians cor 13 4-7',
    text: 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up,\n\nDoth not behave itself unseemly, seeketh not her own, is not easily provoked, thinketh no evil;\n\nRejoiceth not in iniquity, but rejoiceth in the truth;\n\nBeareth all things, believeth all things, hopeth all things, endureth all things.',
  },
];

export const welcomeSlide: Slide = {
  id: 'welcome-1',
  text: 'Welcome home.',
  subtitle: 'THERE’S A PLACE FOR YOU HERE',
  fontSize: 62,
  theme: 'mountain',
  label: 'Welcome',
  notes: 'Welcome everyone. Take a moment to greet new visitors.',
};
const announcement: ServiceItem = {
  id: 'item-welcome',
  title: 'Welcome & gathering',
  type: 'announcement',
  duration: 5,
  slides: [
    welcomeSlide,
    {
      id: 'welcome-2',
      text: 'Better, together.',
      subtitle: 'LET’S MAKE ROOM FOR ONE ANOTHER',
      fontSize: 62,
      theme: 'forest',
      label: 'Community',
    },
  ],
};

export function createSeed(churchName = 'Grace Community', name = 'Friend'): WorkspaceData {
  const sunday = new Date();
  sunday.setDate(sunday.getDate() + ((7 - sunday.getDay()) % 7));
  const gatheringDate = (offset: number) => {
    const date = new Date(sunday);
    date.setDate(date.getDate() + offset);
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  };
  const items: ServiceItem[] = [
    structuredClone(announcement),
    {
      id: 'item-call',
      title: 'Call to worship',
      type: 'scripture',
      duration: 3,
      slides: makeSlides(
        'Make a joyful noise unto the LORD, all ye lands.\nServe the LORD with gladness: come before his presence with singing.',
        'sand',
        28,
        48,
        'Psalm 100:1–2 · KJV',
      ),
    },
    {
      id: 'item-grace',
      title: 'Amazing Grace',
      type: 'song',
      duration: 5,
      slides: makeSlides(
        sampleSongs[0].lyrics,
        'mountain',
        32,
        48,
        'Amazing Grace · John Newton · Public domain',
      ),
    },
    {
      id: 'item-vision',
      title: 'Be Thou My Vision',
      type: 'song',
      duration: 5,
      slides: makeSlides(
        sampleSongs[1].lyrics,
        'forest',
        32,
        48,
        'Be Thou My Vision · Mary E. Byrne / Eleanor H. Hull · Public domain',
      ),
    },
    {
      id: 'item-psalm',
      title: 'Psalm 23',
      type: 'scripture',
      duration: 3,
      slides: makeSlides(scripturePassages[0].text, 'mountain', 28, 48, 'Psalm 23 · KJV'),
    },
    {
      id: 'item-sermon',
      title: 'The way of love',
      type: 'sermon',
      duration: 25,
      notes: 'A life shaped by grace — week one.',
      slides: [
        {
          id: 'sermon-1',
          text: 'The way of love.',
          subtitle: 'A LIFE SHAPED BY GRACE · WEEK 01',
          theme: 'sand',
          fontSize: 62,
          label: 'Message title',
          notes: 'Introduce our new series. A life of love begins with receiving love.',
        },
        {
          id: 'sermon-2',
          text: 'Love makes room.',
          subtitle: '01 — A HEART THAT WELCOMES',
          theme: 'sand',
          fontSize: 58,
          label: 'Point one',
        },
        {
          id: 'sermon-3',
          text: 'Love shows up.',
          subtitle: '02 — FAITH IN THE EVERYDAY',
          theme: 'sand',
          fontSize: 58,
          label: 'Point two',
        },
        {
          id: 'sermon-4',
          text: 'Love changes things.',
          subtitle: '03 — SMALL STEPS, LASTING CHANGE',
          theme: 'sand',
          fontSize: 58,
          label: 'Point three',
        },
      ],
    },
    {
      id: 'item-notices',
      title: 'Life in our community',
      type: 'announcement',
      duration: 4,
      slides: [
        {
          id: 'notices-1',
          text: 'Life is better\nin community.',
          subtitle: 'SMALL GROUPS · WEDNESDAYS AT 7 PM',
          theme: 'lavender',
          fontSize: 54,
          label: 'Small groups',
        },
        {
          id: 'notices-2',
          text: 'You belong here.',
          subtitle: 'STAY FOR A COFFEE. WE’D LOVE TO MEET YOU.',
          theme: 'forest',
          fontSize: 60,
          label: 'Connection',
        },
      ],
    },
    {
      id: 'item-close',
      title: 'Go in peace',
      type: 'announcement',
      duration: 2,
      slides: [
        {
          id: 'close-1',
          text: 'Go in peace.',
          subtitle: 'CARRY A LITTLE LIGHT INTO YOUR WEEK',
          theme: 'mountain',
          fontSize: 62,
          label: 'Closing',
        },
      ],
    },
  ];
  return {
    schemaVersion: 1,
    settings: {
      churchName,
      name,
      ccliLicense: '',
      defaultTheme: 'mountain',
      defaultFontSize: 48,
      wordsPerSlide: 28,
    },
    services: [
      {
        id: 'sunday-gathering',
        title: 'Sunday gathering',
        date: gatheringDate(0),
        time: '10:00',
        description: 'A little space to gather, worship, and grow together.',
        theme: 'mountain',
        items,
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'midweek',
        title: 'Midweek & meaningful',
        date: gatheringDate(3),
        time: '19:00',
        description: 'An unhurried evening in the Word.',
        theme: 'forest',
        items: [structuredClone(announcement), structuredClone(items[4])],
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'youth-night',
        title: 'Friday youth night',
        date: gatheringDate(5),
        time: '18:30',
        description: 'Good friends. Big questions. Real faith.',
        theme: 'lavender',
        items: [structuredClone(announcement)],
        updatedAt: new Date().toISOString(),
      },
    ],
    songs: structuredClone(sampleSongs),
    media: [
      {
        id: 'media-mountain',
        name: 'First light — mountain sunrise',
        type: 'image',
        url: 'asset:images/mountain-dawn.jpg',
        size: 0,
        createdAt: '2026-10-22T00:00:00Z',
      },
    ],
  };
}
