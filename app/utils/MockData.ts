import {ImageSourcePropType} from 'react-native';

export type ShelfData = {
  id: string;
  title: string;
  count: number;
  books: {id: string; title: string; cover_url: ImageSourcePropType}[];
};

export type CommentData = {
  id: string;
  body: string;
  username: string;
  userId?: string;
  userAvatar?: ImageSourcePropType;
  parentId: string | null;
  createdAt: string;
};

export type Book = {
  id: string;
  title: string;
  subtitle: string;
  cast: string;
  narrator: string;
  series?: string;
  runtime: string;
  year: string;
  image: ImageSourcePropType;
  starRating: string;
  rating: string;
  genre: string;
  summary: string;
};

export const getComments = async (): Promise<CommentData[]> => {
  return [
    {
      id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
      body: "I just couldn't put this book down. There are many moments of comedy gold (that come across even better on audio, but still drew out-loud laughter when I read them in print) and lots of insight into what it was like growing up in South Africa under the later years of apartheid, and after ts collapse (which I prefer reading in print so I can take my time to appreciate the gravity of the issues).",
      userId: 'bd7acbea-c1b1-46c2-aed5-3ad53abb2843',
      username: 'Noob master',
      userAvatar: require('../assets/images/avatar/Memoji-17.png'),
      parentId: null,
      createdAt: '2022-08-16T23:00:33.010+02:00',
    },
    {
      id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28bc',
      body: 'Listened to this on oto?',
      userId: 'bd7acbea-c1b1-46c2-aed5-3ad53abb2823',
      username: 'John Doe',
      userAvatar: require('../assets/images/avatar/Memoji-18.png'),
      parentId: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
      createdAt: '2022-08-16T23:00:33.010+02:00',
    },
    {
      id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28da',
      body: "If you're going to read this book, definitely listen to the audio version. Trevor Noah is one of the most effortless narrators I've ever listened to. It genuinely feels like he is sitting down with you and telling you his life story. Not only that, but you get to learn quite a bit about pre- and post-Apartheid South Africa from the perspective of someone who hypothetically shouldn't exist. Noah's mother is black and his father is white, and when he was born any mixed-race relationships were illegal. I was instantly intrigued by his story, not only because of this unique perspective but also because he is such a wonderful storyteller.",
      userId: 'bd7acbea-c1b1-46c2-aed5-3ad53abb2833',
      username: 'Anonymous',
      userAvatar: require('../assets/images/avatar/Memoji-01.png'),
      parentId: null,
      createdAt: '2022-08-16T23:00:33.010+02:00',
    },
  ];
};

export const getCurrentlyListen = async () => {
  return [
    {
      id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
      title: 'Becoming',
      author: 'Michelle Obama',
      naratedby: 'Michelle Obama',
      cover_url: require('../assets/images/books/51QMk4Lt1kL.jpg'),
      length: '19h 3m',
      timeStamp: '3h',
      updated_at: 'August 03, 2022',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
      title: 'The Moment of Lift How Empowering Women Changes the World',
      author: 'Melinda Gates',
      naratedby: 'Melinda Gates',
      cover_url: require('../assets/images/books/41k+OevSHfL.jpg'),
      length: '8h 9m',
      timeStamp: '5h',
      updated_at: 'July 19, 2022',
    },
  ];
};

export const getFeeds = async () => {
  return [
    {
      feed_id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
      feed_type: 'rated',
      feed_user: 'John Doe',
      user_avatar: require('../assets/images/avatar/Memoji-18.png'),
      feed_rating: 4.5,
      feed_comments:
        'I was really surprised when Trevor Noah was named Jon Stewarts successor on the daily show. I inherently knew that the would not pick some...',
      created_at: '3 days ago',
      data: {
        book_id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
        book_title: 'Born a Crime Stories from a South African Childhood',
        book_author: 'Trevor Noah',
        book_cover_url: require('../assets/images/books/51Mc--F6zGL.jpg'),
      },
    },
    {
      feed_id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
      feed_type: 'wants to listen',
      feed_user: 'Jese Leos',
      user_avatar: require('../assets/images/avatar/Memoji-01.png'),
      created_at: '4 days ago',
      data: {
        book_id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
        book_title:
          'Radical Candor Be a Kick-Ass Boss Without Losing Your Humanity',
        book_author: 'Kim Scott',
        book_cover_url: require('../assets/images/books/51xWgLZHDCL.jpg'),
        book_length: '10h 2m',
        book_ratings: '4.95',
        book_revies: '73 Reviews',
      },
    },
    {
      feed_id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
      feed_type: 'made progress..',
      feed_user: 'Jane Doe',
      user_avatar: require('../assets/images/avatar/Memoji-17.png'),
      created_at: '3 days ago',
      data: {
        book_id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
        book_title: 'Bad Blood Secrets and Lies in a Silicon Valley Startup',
        book_author: 'John Carreyrou',
        book_cover_url: require('../assets/images/books/41AbpgAXGoL.jpg'),
        book_length: '4h of 11h and 37m',
        book_timeStamp: '4h',
      },
    },
    {
      feed_id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
      feed_type: 'rated',
      feed_user: 'John Doe',
      feed_rating: 4.5,
      feed_comments:
        'I was really surprised when Trevor Noah was named Jon Stewarts successor on the daily show. I inherently knew that the would not pick some...',
      created_at: '3 days ago',
      data: {
        book_id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
        book_title: 'Born a Crime Stories from a South African Childhood',
        book_author: 'Trevor Noah',
        book_cover_url: require('../assets/images/books/51Mc--F6zGL.jpg'),
      },
    },
  ];
};

export const getRecentSearches = async () => {
  return [
    {
      id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
      title: 'Becoming',
      cover_url: require('../assets/images/books/51QMk4Lt1kL.jpg'),
      search_type: 'book',
    },
    {
      id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
      author: 'Michelle Obama',
      cover_url: require('../assets/images/avatar/Memoji-18.png'),
      search_type: 'author',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
      title: 'The Moment of Lift How Empowering Women Changes the World',
      cover_url: require('../assets/images/books/41k+OevSHfL.jpg'),
      search_type: 'book',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
      author: 'Melinda Gates',
      cover_url: require('../assets/images/avatar/Memoji-17.png'),
      search_type: 'author',
    },
  ];
};

export const getRecommended = async () => {
  return [
    {
      id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
      title: 'Outliers The Story of Success',
      cover_url: require('../assets/images/books/41NOnaoU9sL.jpg'),
      author: 'Malcolm Gladwell',
      rating: 4.95,
    },
    {
      id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28bc',
      title: 'Bad Blood Secrets and Lies in a Silicon Valley Startup',
      cover_url: require('../assets/images/books/41AbpgAXGoL.jpg'),
      author: 'John Carreyrou',
      rating: 4.5,
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
      title: 'Homo Deus A Brief History of Tomorrow',
      cover_url: require('../assets/images/books/51KkLSCnslL.jpg'),
      author: 'Yuval Noah Harari',
      rating: 4.5,
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f64',
      title:
        'The Subtle Art of Not Giving a F*ck A Counterintuitive Approach to Living a Good Life',
      cover_url: require('../assets/images/books/51MT0MbpD7L.jpg'),
      author: 'Mark Manson',
      rating: 4.5,
    },
  ];
};

export const getGenres = async () => {
  return [
    {
      id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
      heading: 'Deciding what to listen next?',
      cta: 'You’re in the right place. Tell us what titles or genres you’ve enjoyed in the past, and we’ll give you surprisingly insightful recommendations.',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
      heading: 'What are your friends listening?',
      cta: 'Chances are your friends are discussing their favorite (and least favorite) books on oto.',
    },
  ];
};

export const getIntro = async () => {
  return [
    {
      id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
      heading: 'Deciding what to listen next?',
      cta: 'You’re in the right place. Tell us what titles or genres you’ve enjoyed in the past, and we’ll give you surprisingly insightful recommendations.',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
      heading: 'What are your friends listening?',
      cta: 'Chances are your friends are discussing their favorite (and least favorite) books on oto.',
    },
  ];
};

export const getAuthors = async () => {
  return [
    {
      id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
      name: 'Mark Manson',
      avatar: require('../assets/images/avatar/Memoji-01.png'),
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
      name: 'Yuval Noah Harari',
      avatar: require('../assets/images/avatar/Memoji-17.png'),
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f64',
      name: 'John Carreyrou',
      avatar: require('../assets/images/avatar/Memoji-18.png'),
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f65',
      name: 'Malcolm Gladwell',
      avatar: require('../assets/images/avatar/Memoji-01.png'),
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f66',
      name: 'Melinda Gates',
      avatar: require('../assets/images/avatar/Memoji-17.png'),
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f67',
      name: 'Michelle Obama',
      avatar: require('../assets/images/avatar/Memoji-18.png'),
    },
  ];
};

export const getShelves = async () => {
  return [
    {
      id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
      title: 'Currently listening',
      count: 2,
      books: [
        {
          id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f66',
          title: 'Becoming',
          cover_url: require('../assets/images/books/51QMk4Lt1kL.jpg'),
        },
        {
          id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f66',
          title: 'The Moment of Lift How Empowering Women Changes the World',
          cover_url: require('../assets/images/books/41k+OevSHfL.jpg'),
        },
      ],
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
      title: 'Wanna to listen',
      count: 5,
      books: [
        {
          id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f66',
          title: 'Wanna to listen',
          cover_url: require('../assets/images/avatar/Memoji-17.png'),
        },
      ],
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f64',
      title: 'Listened',
      count: 20,
      books: [
        {
          id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f66',
          title: 'Wanna to listen',
          cover_url: require('../assets/images/avatar/Memoji-17.png'),
        },
      ],
    },
  ];
};

export const getTags = async () => {
  return [
    {
      id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
      name: 'Business',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
      name: 'Memoir',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f64',
      name: 'Fiction',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f65',
      name: 'None Fiction',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f66',
      name: 'Psychology',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f67',
      name: 'Science',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f68',
      name: 'Self help',
    },
  ];
};

export const getBooks = async (): Promise<Book[]> => {
  return [
    {
      id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
      title: 'Fairy Tale',
      subtitle: '',
      cast: 'Stephen King',
      narrator: 'Seth Numrich, Stephen King',
      runtime: '24h 6m',
      year: '09-06-22',
      image: require('../assets/images/books/51r6QPk-vHL._SL500_.jpg'),
      starRating: '5',
      rating: 'EN',
      genre: 'Supernatural, Suspense, Fantasy',
      summary:
        'Legendary storyteller Stephen King goes into the deepest well of his imagination in this spellbinding novel about a seventeen-year-old boy who inherits the keys to a parallel world where good and evil are at war, and the stakes could not be higher\u2014for that world or ours.\r\n\r\nCharlie Reade looks like a regular high school kid, great at baseball and football, a decent student. But he carries a heavy load. His mom was killed in a hit-and-run accident when he was ten, and grief drove his dad to drink. Charlie learned how to take care of himself\u2014and his dad. When Charlie is seventeen, he meets a dog named Radar and her aging master, Howard Bowditch, a recluse in a big house at the top of a big hill, with a locked shed in the backyard. Sometimes strange sounds emerge from it.\r\n\r\nCharlie starts doing jobs for Mr. Bowditch and loses his heart to Radar. Then, when Bowditch dies, he leaves Charlie a cassette tape telling a story no one would believe. What Bowditch knows, and has kept secret all his long life, is that inside the shed is a portal to another world.\r\n\r\nKing\u2019s storytelling in Fairy Tale soars. This is a magnificent and terrifying tale in which good is pitted against overwhelming evil, and a heroic boy\u2014and his dog\u2014must lead the battle.\r\n\r\nEarly in the Pandemic, King asked himself: \u201cWhat could you write that would make you happy?\u201d\r\n\r\n\u201cAs if my imagination had been waiting for the question to be asked, I saw a vast deserted city\u2014deserted but alive. I saw the empty streets, the haunted buildings, a gargoyle head lying overturned in the street. I saw smashed statues (of what I didn\u2019t know, but I eventually found out). I saw a huge, sprawling palace with glass towers so high their tips pierced the clouds. Those images released the story I wanted to tell.\u201d \r\n\r\n\u00a92022 Stephen King. All rights reserved. (P)2022 Simon & Schuster, Inc. All rights reserved. \u00a92015 YP / RECORD TWO.RIEN QU\u2019UNE FOIS by Keen\u2019V / Zonee.L / Matthieu Evain / Fabrice Vanvert,',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
      title: "I'm Glad My Mom Died",
      subtitle: '',
      cast: 'Jennette McCurdy',
      narrator: 'Jennette McCurdy',
      runtime: '6h 50m',
      year: '08-09-22',
      image: require('../assets/images/books/41clGmWQP6L._SL500_.jpg'),
      starRating: '5',
      rating: 'EN',
      genre:
        'Entertainment & Celebrities, Dysfunctional Families, Relationships',
      summary:
        'A heartbreaking and hilarious memoir by iCarly and Sam & Cat star Jennette McCurdy about her struggles as a former child actor\u2014including eating disorders, addiction, and a complicated relationship with her overbearing mother\u2014and how she retook control of her life.\r\n\r\nJennette McCurdy was six years old when she had her first acting audition. Her mother\u2019s dream was for her only daughter to become a star, and Jennette would do anything to make her mother happy. So she went along with what Mom called \u201ccalorie restriction,\u201d eating little and weighing herself five times a day. She endured extensive at-home makeovers while Mom chided, \u201cYour eyelashes are invisible, okay? You think Dakota Fanning doesn\u2019t tint hers?\u201d She was even showered by Mom until age sixteen while sharing her diaries, email, and all her income.\r\n\r\nIn I\u2019m Glad My Mom Died, Jennette recounts all this in unflinching detail\u2014just as she chronicles what happens when the dream finally comes true. Cast in a new Nickelodeon series called iCarly, she is thrust into fame. Though Mom is ecstatic, emailing fan club moderators and getting on a first-name basis with the paparazzi (\u201cHi Gale!\u201d), Jennette is riddled with anxiety, shame, and self-loathing, which manifest into eating disorders, addiction, and a series of unhealthy relationships. These issues only get worse when, soon after taking the lead in the iCarly spinoff Sam & Cat alongside Ariana Grande, her mother dies of cancer. Finally, after discovering therapy and quitting acting, Jennette embarks on recovery and decides for the first time in her life what she really wants.\r\n\r\nTold with refreshing candor and dark humor, I\u2019m Glad My Mom Died is an inspiring story of resilience, independence, and the joy of shampooing your own hair.\r\n\r\n\u00a92022 Jennette McCurdy (P)2022 Simon & Schuster Audio',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f64',
      title: 'Where the Crawdads Sing',
      subtitle: '',
      cast: 'Delia Owens',
      narrator: 'Cassandra Campbell',
      runtime: '12h 12m',
      year: '08-14-18',
      image: require('../assets/images/books/41KaqVvSGoL._SL500_.jpg'),
      starRating: '5',
      rating: 'EN',
      genre: 'Coming of Age, Literary Fiction, Historical Fiction',
      summary:
        "#1 NEW YORK TIMES BESTSELLING PHENOMENON\u2014NOW A MAJOR MOTION PICTURE!\r\nMore than 15 million copies sold worldwide\r\nA Reese\u2019s Book Club Pick\r\nA Business Insider Defining Book of the Decade\r\n\r\n\u201cI can't even express how much I love this book! I didn't want this story to end!\u201d\u2014Reese Witherspoon\r\n\r\n\u201cPainfully beautiful.\u201d\u2014The New York Times Book Review\r\n\r\nFor years, rumors of the \u201cMarsh Girl\u201d have haunted Barkley Cove, a quiet town on the North Carolina coast. So in late 1969, when handsome Chase Andrews is found dead, the locals immediately suspect Kya Clark, the so-called Marsh Girl. But Kya is not what they say. Sensitive and intelligent, she has survived for years alone in the marsh that she calls home, finding friends in the gulls and lessons in the sand. Then the time comes when she yearns to be touched and loved. When two young men from town become intrigued by her wild beauty, Kya opens herself to a new life\u2014until the unthinkable happens.\r\n\r\nWhere the Crawdads Sing is at once an exquisite ode to the natural world, a heartbreaking coming-of-age story, and a surprising tale of possible murder. Owens reminds us that we are forever shaped by the children we once were, and that we are all subject to the beautiful and violent secrets that nature keeps.\r\n\r\n\u00a92018 Delia Owens (P)2018 Penguin Audio",
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f65',
      title: 'Atomic Habits',
      subtitle: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones',
      cast: 'James Clear',
      narrator: 'James Clear',
      runtime: '5h 35m',
      year: '10-16-18',
      image: require('../assets/images/books/513Y5o-DYtL._SL500_.jpg'),
      starRating: '5',
      rating: 'EN',
      genre: 'Supernatural, Suspense, Fantasy',
      summary:
        "The number one New York Times best seller. Over one million copies sold!\r\n\r\nTiny Changes, Remarkable Results\r\n\r\nNo matter your goals, Atomic Habits offers a proven framework for improving - every day. James Clear, one of the world's leading experts on habit formation, reveals practical strategies that will teach you exactly how to form good habits, break bad ones, and master the tiny behaviors that lead to remarkable results.\r\n\r\nIf you're having trouble changing your habits, the problem isn't you. The problem is your system. Bad habits repeat themselves again and again not because you don't want to change, but because you have the wrong system for change. You do not rise to the level of your goals. You fall to the level of your systems. Here, you'll get a proven system that can take you to new heights.\r\n\r\nClear is known for his ability to distill complex topics into simple behaviors that can be easily applied to daily life and work. Here, he draws on the most proven ideas from biology, psychology, and neuroscience to create an easy-to-understand guide for making good habits inevitable and bad habits impossible. Along the way, listeners will be inspired and entertained with true stories from Olympic gold medalists, award-winning artists, business leaders, life-saving physicians, and star comedians who have used the science of small habits to master their craft and vault to the top of their field.\r\n\r\nLearn how to:\r\n\r\nMake time for new habits (even when life gets crazy)\r\nOvercome a lack of motivation and willpower\r\nDesign your environment to make success easier\r\nGet back on track when you fall off course\r\nAnd much more\r\nAtomic Habits will reshape the way you think about progress and success, and give you the tools and strategies you need to transform your habits - whether you are a team looking to win a championship, an organization hoping to redefine an industry, or simply an individual who wishes to quit smoking, lose weight, reduce stress, or achieve any other goal.\r\n\r\n\u00a92018 James Clear (P)2018 Penguin Audio",
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f66',
      title: 'Tuesdays with Morrie',
      subtitle: '20th Anniversary Edition',
      cast: 'Mitch Albom',
      narrator: 'Mitch Albom',
      runtime: '3h 51m',
      year: '10-18-07',
      image: require('../assets/images/books/41WKiQD2OrL._SL500_.jpg'),
      starRating: '5',
      rating: 'EN',
      genre: 'Biographies & Memoirs, Grief & Loss, Relationships',
      summary:
        '#1 NEW YORK TIMES BESTSELLER \u2022 A special 25th anniversary edition of the beloved book that changed millions of lives\u2014with a new afterword by the author\r\n\r\n\u201cA wonderful book, a story of the heart told by a writer with soul.\u201d\u2014Los Angeles Times\r\n\r\nMaybe it was a grandparent, or a teacher, or a colleague. Someone older, patient and wise, who understood you when you were young and searching, helped you see the world as a more profound place, gave you sound advice to help you make your way through it.\r\n\r\nFor Mitch Albom, that person was Morrie Schwartz, his college professor from nearly twenty years ago.\r\n\r\nMaybe, like Mitch, you lost track of this mentor as you made your way, and the insights faded, and the world seemed colder. Wouldn\u2019t you like to see that person again, ask the bigger questions that still haunt you, receive wisdom for your busy life today the way you once did when you were younger?\r\n\r\nMitch Albom had that second chance. He rediscovered Morrie in the last months of the older man\u2019s life. Knowing he was dying, Morrie visited with Mitch in his study every Tuesday, just as they used to back in college. Their rekindled relationship turned into one final \u201cclass\u201d: lessons in how to live.\r\n\r\nTuesdays with Morrie is a magical chronicle of their time together, through which Mitch shares Morrie\u2019s lasting gift with the world.\r\n\r\n\u00a91997 Mitch Albom (P)2004 Random House, Inc. Random House Audio, a division of Random House, Inc.',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f67',
      title: 'Starry Messenger',
      subtitle: 'Cosmic Perspectives on Civilization',
      cast: 'Neil deGrasse Tyson',
      narrator: 'Neil deGrasse Tyson',
      runtime: '7 hrs and 17 mins',
      year: '09-20-22',
      image: require('../assets/images/books/510gGUV10XL._SL500_.jpg'),
      starRating: '5',
      rating: 'English',
      genre: 'Philosophy, Physics',
      summary:
        'This program is read by the author, world-renowned astrophysicist Neil deGrasse Tyson.\r\n\r\nBringing his cosmic perspective to civilization on Earth, Neil deGrasse Tyson shines new light on the crucial fault lines of our time\u2014war, politics, religion, truth, beauty, gender, and race\u2014in a way that stimulates a deeper sense of unity for us all.\r\n\r\nIn a time when our political and cultural views feel more polarized than ever, Tyson provides a much-needed antidote to so much of what divides us, while making a passionate case for the twin chariots of enlightenment\u2014a cosmic perspective and the rationality of science.\r\n\r\nAfter thinking deeply about how science sees the world and about Earth as a planet, the human brain has the capacity to reset and recalibrates life\u2019s priorities, shaping the actions we might take in response. No outlook on culture, society, or civilization remains untouched.\r\n\r\nWith crystalline prose, Starry Messenger walks us through the scientific palette that sees and paints the world differently. From insights on resolving global conflict to reminders of how precious it is to be alive, Tyson reveals, with warmth and eloquence, an array of brilliant and beautiful truths that apply to us all, informed and enlightened by knowledge of our place in the universe.\r\n\r\nA Macmillan Audio production from Henry Holt and Company. \r\n\r\n\u00a92022 Neil deGrasse Tyson (P)2022 Macmillan Audio',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f68',
      title: 'All Good People Here',
      subtitle: 'A Novel',
      cast: 'Ashley Flowers',
      narrator: 'Brittany Pressley, Karissa Vacker, Ashley Flowers',
      runtime: '10 hrs and 35 mins',
      year: '08-16-22',
      image: require('../assets/images/books/41E1SK2D3JL._SL500_.jpg'),
      starRating: '4.5',
      rating: 'English',
      genre: 'Women Sleuths, Crime Thrillers, Suspense',
      summary:
        'In the propulsive debut novel from the host of the #1 true crime podcast Crime Junkie, a journalist uncovers her hometown\u2019s dark secrets when she becomes obsessed with the unsolved murder of her childhood neighbor\u2014and the disappearance of another girl twenty years later. \r\n\r\nYou can\u2019t ever know for sure what happens behind closed doors.\r\n\r\nEveryone from Wakarusa, Indiana, remembers the infamous case of January Jacobs, who was discovered in a ditch hours after her family awoke to find her gone. Margot Davies was six at the time, the same age as January\u2014and they were next-door neighbors. In the twenty years since, Margot has grown up, moved away, and become a big-city journalist. But she\u2019s always been haunted by the feeling that it could\u2019ve been her. And the worst part is, January\u2019s killer has never been brought to justice.\r\n\r\nWhen Margot returns home to help care for her uncle after he is diagnosed with early-onset dementia, she feels like she\u2019s walked into a time capsule. Wakarusa is exactly how she remembers\u2014genial, stifled, secretive. Then news breaks about five-year-old Natalie Clark from the next town over, who\u2019s gone missing under circumstances eerily similar to January\u2019s. With all the old feelings rushing back, Margot vows to find Natalie and to solve January\u2019s murder once and for all.\r\n\r\nBut the police, Natalie\u2019s family, the townspeople\u2014they all seem to be hiding something. And the deeper Margot digs into Natalie\u2019s disappearance, the more resistance she encounters, and the colder January\u2019s case feels. Could January\u2019s killer still be out there? Is it the same person who took Natalie? And what will it cost to finally discover what truly happened that night twenty years ago?\r\n\r\nTwisty, chilling, and intense, All Good People Here is a searing tale that asks: What are your neighbors capable of when they think no one is watching?\r\n\r\n\u00a92022 Ashley Flowers (P)2022 Random House Audio',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f69',
      title: 'It Ends with Us',
      subtitle: '',
      cast: 'Colleen Hoover',
      narrator: 'Olivia Song',
      runtime: '11 hrs and 11 mins',
      year: '08-02-16',
      image: require('../assets/images/books/61ideL3gloL._SL500_.jpg'),
      starRating: '4.5',
      rating: 'English',
      genre: "Women's Fiction, Contemporary",
      summary:
        'In this \u201cbrave and heartbreaking novel that digs its claws into you and doesn\u2019t let go, long after you\u2019ve finished it\u201d (Anna Todd, New York Times bestselling author) from the #1 New York Times bestselling author of All Your Perfects, a workaholic with a too-good-to-be-true romance can\u2019t stop thinking about her first love.\r\n\r\nLily hasn\u2019t always had it easy, but that\u2019s never stopped her from working hard for the life she wants. She\u2019s come a long way from the small town where she grew up\u2014she graduated from college, moved to Boston, and started her own business. And when she feels a spark with a gorgeous neurosurgeon named Ryle Kincaid, everything in Lily\u2019s life seems too good to be true.\r\n\r\nRyle is assertive, stubborn, maybe even a little arrogant. He\u2019s also sensitive, brilliant, and has a total soft spot for Lily. And the way he looks in scrubs certainly doesn\u2019t hurt. Lily can\u2019t get him out of her head. But Ryle\u2019s complete aversion to relationships is disturbing. Even as Lily finds herself becoming the exception to his \u201cno dating\u201d rule, she can\u2019t help but wonder what made him that way in the first place.\r\n\r\nAs questions about her new relationship overwhelm her, so do thoughts of Atlas Corrigan\u2014her first love and a link to the past she left behind. He was her kindred spirit, her protector. When Atlas suddenly reappears, everything Lily has built with Ryle is threatened.\r\n\r\nAn honest, evocative, and tender novel, It Ends with Us is \u201ca glorious and touching read, a forever keeper. The kind of book that gets handed down\u201d (USA TODAY).\r\n\r\n\u00a92016 Colleen Hoover (P)2016 Simon & Schuster Audio',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f71',
      title: 'Fire & Blood (HBO Tie-in Edition)',
      subtitle: '300 Years Before A Game of Thrones',
      cast: 'George R. R. Martin',
      narrator: 'Simon Vance',
      series: 'The Targaryen Dynasty: The House of the Dragon',
      runtime: '26 hrs and 24 mins',
      year: '11-20-18',
      image: require('../assets/images/books/51+EyQja6PL._SL500_.jpg'),
      starRating: '4.5',
      rating: 'English',
      genre: 'Action & Adventure, Dragons & Mythical Creatures, Epic',
      summary:
        '#1 NEW YORK TIMES BESTSELLER \u2022 The thrilling history of the Targaryens comes to life in this masterly work, the inspiration for HBO\u2019s upcoming Game of Thrones prequel series House of the Dragon\r\n\r\n\u201cThe thrill of Fire & Blood is the thrill of all Martin\u2019s fantasy work: familiar myths debunked, the whole trope table flipped.\u201d\u2014Entertainment Weekly\r\n\r\nCenturies before the events of A Game of Thrones, House Targaryen\u2014the only family of dragonlords to survive the Doom of Valyria\u2014took up residence on Dragonstone. Fire & Blood begins their tale with the legendary Aegon the Conqueror, creator of the Iron Throne, and goes on to recount the generations of Targaryens who fought to hold that iconic seat, all the way up to the civil war that nearly tore their dynasty apart.\r\n\r\nWhat really happened during the Dance of the Dragons? Why was it so deadly to visit Valyria after the Doom? What were Maegor the Cruel\u2019s worst crimes? What was it like in Westeros when dragons ruled the skies? These are but a few of the questions answered in this essential chronicle, as related by a learned maester of the Citadel and featuring more than eighty all-new black-and-white illustrations by artist Doug Wheatley\u2014including five all-new illustrations exclusive to this edition. Readers have glimpsed small parts of this narrative in such volumes as The World of Ice & Fire, but now, for the first time, the full tapestry of Targaryen history is revealed.\r\n\r\nWith all the scope and grandeur of Gibbon\u2019s The History of the Decline and Fall of the Roman Empire, Fire & Blood is the the first volume of the definitive two-part history of the Targaryens, giving readers a whole new appreciation for the dynamic, often bloody, and always fascinating history of Westeros.\r\n\r\nIncludes a bonus PDF of illustrations from the book\r\n\r\nPLEASE NOTE: When you purchase this title, the accompanying PDF will be available in your Audible Library along with the audio.\r\n\r\n\u201cThe saga is a rich and dark one, full of both the title\u2019s promised elements. . . . It\u2019s hard not to thrill to the descriptions of dragons engaging in airborne combat, or the dilemma of whether defeated rulers should \u2018bend the knee,\u2019 \u2018take the black\u2019 and join the Night\u2019s Watch, or simply meet an inventive and horrible end.\u201d\u2014The Guardian\r\n\u00a92018 George R. R. Martin (P)2018 Random House Audio',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f72',
      title: 'The Lost Book of Eleanor Dare',
      subtitle: '',
      cast: 'Kimberly Brock',
      narrator: 'Brittany Pressley',
      runtime: '15 hrs and 26 mins',
      year: '04-12-22',
      image: require('../assets/images/books/61TO7RKNtdL._SL500_.jpg'),
      starRating: '4',
      rating: 'English',
      genre: "World War II, Women's Fiction, Historical",
      summary:
        'The fate of the world is often driven by the curiosity of a girl.\r\n\r\nWhat happened to the Lost Colony of Roanoke remains a mystery, but the women who descended from Eleanor Dare have long known that the truth lies in what she left behind: a message carved onto a large stone and the contents of her treasured commonplace book. Brought from England on Eleanor\u2019s fateful voyage to the New World, her book was passed down through the fifteen generations of daughters who followed as they came of age. Thirteen-year-old Alice had been next in line to receive it, but her mother\u2019s tragic death fractured the unbroken legacy and the Dare Stone and the shadowy history recorded in the book faded into memory. Or so Alice hoped.\r\n\r\nIn the waning days of World War II, Alice is a young widow and a mother herself when she is unexpectedly presented with her birthright: the deed to Evertell, her abandoned family home and the history she thought forgotten. Determined to sell the property and step into a future free of the past, Alice returns to Savannah with her own thirteen-year-old daughter, Penn, in tow. But when Penn\u2019s curiosity over the lineage she never knew begins to unveil secrets from beneath every stone and bone and shell of the old house and Eleanor\u2019s book is finally found, Alice is forced to reckon with the sacrifices made for love and the realities of their true inheritance as daughters of Eleanor Dare.\r\n\r\nIn this sweeping tale from award-winning author Kimberly Brock, the answers to a real-life mystery may be found in the pages of a story that was always waiting to be written.\r\n\r\nPraise for The Lost Book of Eleanor Dare:\r\n\r\n\u201cFrom the haunting first line, The Lost Book of Eleanor Dare transports the reader to a mysterious land, time and family . . . the captivating women of the Dare legacy must find their true inheritance hiding behind the untold secrets.\u201d \u2014Patti Callahan, New York Times bestselling author\r\n\r\nHistorical women\u2019s fiction\r\nStand-alone novel\r\nBook length: approximately 135,000 words\r\n\u00a92022 Kimberly Brock (P)2022 Harper Muse',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f73',
      title: 'The Divider',
      subtitle: 'Trump in the White House, 2017-2021',
      cast: 'Peter Baker, Susan Glasser',
      narrator: 'Michael Quinlan',
      runtime: '28 hrs and 46 mins',
      year: '09-20-22',
      image: require('../assets/images/books/41EX8-ZRk4L._SL500_.jpg'),
      starRating: '4.5',
      rating: 'English',
      genre: 'Presidents & Heads of State, United States',
      summary:
        'The inside story of the four years when Donald Trump went to war with Washington, from the chaotic beginning to the violent finale, told by revered journalists Peter Baker of The New York Times and Susan Glasser of The New Yorker\u2014an ambitious and lasting history of the full Trump presidency that also contains dozens of exclusive scoops and stories from behind the scenes in the White House, from the absurd to the deadly serious.\r\n\r\nThe bestselling authors of The Man Who Ran Washington argue that Trump was not just lurching from one controversy to another; he was learning to be more like the foreign autocrats he admired.\r\n\r\nThe Divider brings us into the Oval Office for countless scenes both tense and comical, revealing how close we got to nuclear war with North Korea, which cabinet members had a resignation pact, whether Trump asked Japan\u2019s prime minister to nominate him for a Nobel Prize and much more. The book also explores the moral choices confronting those around Trump\u2014how they justified working for a man they considered unfit for office, and where they drew their lines.\r\n\r\nThe Divider is based on unprecedented access to key players, from President Trump himself to cabinet officers, military generals, close advisers, Trump family members, congressional leaders, foreign officials and others, some of whom have never told their story until now.\r\n\r\n\u00a92022 Peter Baker, Susan Glasser (P)2022 Random House Audio',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f74',
      title: 'Dreamland',
      subtitle: 'A Novel',
      cast: 'Nicholas Sparks',
      narrator: 'Austin Nichols, Thérèse Plummer, Nicholas Sparks',
      runtime: '9 hrs and 47 mins',
      year: '09-20-22',
      image: require('../assets/images/books/51JjhszjrIL._SL500_.jpg'),
      starRating: '4.5',
      rating: 'English',
      genre: 'Contemporary',
      summary:
        'From the #1 New York Times bestselling author of The Wish comes a poignant love story about risking everything for a dream{\u2014}and whether it{\u2019}s possible to leave the past behind.\r\n\r\nColby Mills once felt destined for a musical career, until tragedy grounded his aspirations. Now the head of a small family farm in North Carolina, he spontaneously takes a gig playing at a bar in St. Pete Beach, Florida, seeking a rare break from his duties at home.\r\n\r\nBut when he meets Morgan Lee, his world is turned upside-down, making him wonder if the responsibilities he has shouldered need dictate his life forever. The daughter of affluent Chicago doctors, Morgan has graduated from a prestigious college music program with the ambition to move to Nashville and become a star. Romantically and musically, she and Colby complete each other in a way that neither has ever known.\r\n\r\nWhile they are falling headlong in love, Beverly is on a heart-pounding journey of another kind. Fleeing an abusive husband with her six-year-old son, she is trying to piece together a life for them in a small town far off the beaten track. With money running out and danger seemingly around every corner, she makes a desperate decision that will rewrite everything she knows to be true.\r\n\r\nIn the course of a single unforgettable week, two young people will navigate the exhilarating heights and heartbreak of first love. Hundreds of miles away, Beverly will put her love for her young son to the test. And fate will draw all three people together in a web of life-altering connections . . . forcing each to wonder whether the dream of a better life can ever survive the weight of the past.\r\n\r\n\u00a92022 Nicholas Sparks (P)2022 Random House Audio',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f75',
      title: 'The Silmarillion',
      subtitle: '',
      cast: 'J. R. R. Tolkien',
      narrator: 'Martin Shaw',
      series: 'The Lord of the Rings',
      runtime: '14 hrs and 49 mins',
      year: '10-29-15',
      image: require('../assets/images/books/51fL6o4DxBL._SL500_.jpg'),
      starRating: '4.5',
      rating: 'English',
      genre: 'Classics, Epic',
      summary:
        "The complete unabridged audiobook of J.R.R Tolkien's The Silmarillion.{\r\n\r\n}The Silmarillion is an account of the Elder Days, of the First Age of Tolkien{\u2019}s world. It is the ancient drama to which the characters in The Lord of the Rings look back, and in whose events some of them such as Elrond and Galadriel took part. The tales of The Silmarillion are set in an age when Morgoth, the first Dark Lord, dwelt in Middle-Earth, and the High Elves made war upon him for the recovery of the Silmarils, the jewels containing the pure light of Valinor.\r\n\r\nIncluded in the book are several shorter works. 'The Ainulindale' is a myth of the Creation and in the Valaquenta the nature and powers of each of the gods is described. 'The Akallabeth' recounts the downfall of the great island kingdom of N\u00famenor at the end of the Second Age and 'Of the Rings of Power' tells of the great events at the end of the Third Age, as narrated in The Lord of the Rings.\r\n\r\n\u00a92015 The Tolkien Estate and CR Tolkien (P)2015 HarperCollins Publishers Limited",
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f76',
      title: 'Decimate',
      subtitle: '',
      cast: 'Christopher Rice',
      narrator: 'Karen Peakes',
      runtime: '14 hrs and 18 mins',
      year: '05-10-22',
      image: require('../assets/images/books/51wtLbJyr5L._SL500_.jpg'),
      starRating: '4.5',
      rating: 'English',
      genre: 'Psychological, Supernatural, Suspense',
      summary:
        'A desperate family confronts the mysteries that lie between life and death in this soul-gripping novel of supernatural suspense by Amazon Charts and New York Times bestselling author Christopher Rice.\r\n\r\nClaire Huntley and her brother, Poe, were on a midnight hike in Montana when the woods went wild. A blinding, devouring light and a rumbling pulse that blasted them off their feet left both kids with little memory of what happened. Their father insisted it was a violent extraterrestrial abduction; his wild obsession would tear their family apart in the wake of the trauma.\r\n\r\nFourteen years later, Claire, who\u2019s battled anxiety attacks since that fateful hike, wants to heal her relationship with her brother, which has been damaged by his years of addiction. But only hours before their reunion, Poe\u2019s crowded passenger plane plunges into the Colorado mountains. No one survives the fiery crash. In the midst of her grief, Claire accepts her estranged father\u2019s request to join him in Montana, where he continues to investigate the paranormal force he believes altered his children down to their bones.\r\n\r\nAs they reunite, Claire\u2019s anxiety attacks take on a new dimension. Is she experiencing hallucinations or visions? Is her brother\u2019s presence in them a symptom of grief, or is she receiving messages from beyond life? The answers Claire and her father seek will take them on a breakneck journey deep into the Montana wilderness and the shadows of history, where they will unearth a secret force with terrifying implications for their family\u2014and the world.\r\n\r\n\u00a92022 Christopher Rice (P)2022 Brilliance Publishing, Inc., all rights reserved.',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f77',
      title: 'Greenlights',
      subtitle: '',
      cast: 'Matthew McConaughey',
      narrator: 'Matthew McConaughey',
      runtime: '6 hrs and 42 mins',
      year: '10-20-20',
      image: require('../assets/images/books/51DZeZw7K0L._SL500_.jpg'),
      starRating: '5',
      rating: 'English',
      genre: 'Entertainment & Celebrities, Personal Success',
      summary:
        'Number-one New York Times Best Seller {\u2022} Discover the life-changing memoir that has inspired millions of readers through the Academy Award\u00ae-winning actor\u2019s unflinching honesty, unconventional wisdom, and lessons learned the hard way about living with greater satisfaction.\r\n\r\nNamed One of the Best Books of the Year by The Guardian\r\n\r\n\u201cMcConaughey\u2019s book invites us to grapple with the lessons of his life as he did - and to see that the point was never to win, but to understand.\u201d (Mark Manson, author of The Subtle Art of Not Giving a F*ck)\r\n\r\nI\u2019ve been in this life for 50 years, been trying to work out its riddle for 42, and been keeping diaries of clues to that riddle for the last 35. Notes about successes and failures, joys and sorrows, things that made me marvel, and things that made me laugh out loud. How to be fair. How to have less stress. How to have fun. How to hurt people less. How to get hurt less. How to be a good man. How to have meaning in life. How to be more me.\r\n\r\nRecently, I worked up the courage to sit down with those diaries. I found stories I experienced, lessons I learned and forgot, poems, prayers, prescriptions, beliefs about what matters, some great photographs, and a whole bunch of bumper stickers. I found a reliable theme, an approach to living that gave me more satisfaction, at the time, and still: If you know how, and when, to deal with life\u2019s challenges - how to get relative with the inevitable - you can enjoy a state of success I call \u201ccatching greenlights.\u201d\r\n\r\nSo I took a one-way ticket to the desert and wrote this book: an album, a record, a story of my life so far. This is fifty years of my sights and seens, felts and figured-outs, cools and shamefuls. Graces, truths, and beauties of brutality. Getting away withs, getting caughts, and getting wets while trying to dance between the raindrops.\r\n\r\nHopefully, it\u2019s medicine that tastes good, a couple of aspirin instead of the infirmary, a spaceship to Mars without needing your pilot\u2019s license, going to church without having to be born again, and laughing through the tears.\r\n\r\nIt\u2019s a love letter. To life.\r\n\r\nIt\u2019s also a guide to catching more greenlights - and to realizing that the yellows and reds eventually turn green, too.\r\n\r\nGood luck.\r\n\r\n\u00a92020 Matthew McConaughey (P)2020 Random House Audio',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f78',
      title: 'The Subtle Art of Not Giving a F*ck',
      subtitle: 'A Counterintuitive Approach to Living a Good Life',
      cast: 'Mark Manson',
      narrator: 'Roger Wayne',
      runtime: '5 hrs and 17 mins',
      year: '09-13-16',
      image: require('../assets/images/books/51MT0MbpD7L.jpg'),
      starRating: '4.5',
      rating: 'English',
      genre: 'Personal Success',
      summary:
        'In this generation-defining self-help guide, a superstar blogger cuts through the crap to show us how to stop trying to be positive all the time so that we can truly become better, happier people. \r\n\r\nFor decades we\'ve been told that positive thinking is the key to a happy, rich life. "F*ck positivity," Mark Manson says. "Let\'s be honest, shit is f*cked, and we have to live with it." In his wildly popular Internet blog, Manson doesn\'t sugarcoat or equivocate. He tells it like it is - a dose of raw, refreshing, honest truth that is sorely lacking today. The Subtle Art of Not Giving a F*ck is his antidote to the coddling, let\'s-all-feel-good mind-set that has infected modern society and spoiled a generation, rewarding them with gold medals just for showing up. \r\n\r\nManson makes the argument, backed by both academic research and well-timed poop jokes, that improving our lives hinges not on our ability to turn lemons into lemonade but on learning to stomach lemons better. Human beings are flawed and limited - "not everybody can be extraordinary; there are winners and losers in society, and some of it is not fair or your fault". Manson advises us to get to know our limitations and accept them. Once we embrace our fears, faults, and uncertainties, once we stop running and avoiding and start confronting painful truths, we can begin to find the courage, perseverance, honesty, responsibility, curiosity, and forgiveness we seek. \r\n\r\nThere are only so many things we can give a f*ck about, so we need to figure out which ones really matter, Manson makes clear. While money is nice, caring about what you do with your life is better, because true wealth is about experience. A much-needed grab-you-by-the-shoulders-and-look-you-in-the-eye moment of real talk, filled with entertaining stories and profane, ruthless humor, The Subtle Art of Not Giving a F*ck is a refreshing slap for a generation to help them lead contented, grounded lives. \r\n\r\n\u00a92016 Mark Manson (P)2016 HarperCollins Publishers',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f79',
      title: 'The Butcher and the Wren',
      subtitle: 'A Novel',
      cast: 'Alaina Urquhart',
      narrator: 'Sophie Amoss, Joe Knezevich',
      runtime: '6 hrs and 23 mins',
      year: '09-13-22',
      image: require('../assets/images/books/410IBmKrs-L._SL500_.jpg'),
      starRating: '4.5',
      rating: 'English',
      genre: 'Crime Thrillers, Suspense',
      summary:
        "From the co-host of chart-topping true crime podcast Morbid, a thrilling debut novel told from the dueling perspectives of a notorious serial killer and the medical examiner following where his trail of victims leads \r\n\r\nSomething dark is lurking in the Louisiana bayou: a methodical killer with a penchant for medical experimentation is hard at work completing his most harrowing crime yet, taunting the authorities who desperately try to catch up. \r\n\r\nBut forensic pathologist Dr. Wren Muller is the best there is. Armed with an encyclopedic knowledge of historical crimes, and years of experience working in the Medical Examiner's office, she's never encountered a case she couldn't solve. Until now. Case after case is piling up on Wren's examination table, and soon she is sucked into an all-consuming cat-and-mouse chase with a brutal murderer getting more brazen by the day. \r\n\r\nAn addictive listen with straight-from-the-morgue details only an autopsy technician could provide, The Butcher and the Wren promises to ensnare all who enter.\r\n\r\n\u00a92022 Alaina Urquhart (P)2022 Zando",
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f80',
      title: 'Project Hail Mary',
      subtitle: '',
      cast: 'Andy Weir',
      narrator: 'Ray Porter',
      runtime: '16 hrs and 10 mins',
      year: '05-04-21',
      image: require('../assets/images/books/51b6fvQr1-L._SL500_.jpg'),
      starRating: '5',
      rating: 'English',
      genre: 'Adventure, Hard Science Fiction, Space Opera',
      summary:
        "Winner of the 2022 Audie Awards Audiobook of the Year.{\r\n\r\n}Number-One Audible and New York Times Audio Best Seller{\r\n\r\n}A lone astronaut must save the earth from disaster in this incredible new science-based thriller from the number-one New York Times best-selling author of The Martian.\r\n\r\nRyland Grace is the sole survivor on a desperate, last-chance mission - and if he fails, humanity and the Earth itself will perish.\r\n\r\nExcept that right now, he doesn't know that. He can't even remember his own name, let alone the nature of his assignment or how to complete it.\r\n\r\nAll he knows is that he's been asleep for a very, very long time. And he's just been awakened to find himself millions of miles from home, with nothing but two corpses for company.\r\n\r\nHis crewmates dead, his memories fuzzily returning, he realizes that an impossible task now confronts him. Alone on this tiny ship that's been cobbled together by every government and space agency on the planet and hurled into the depths of space, it's up to him to conquer an extinction-level threat to our species.\r\n\r\nAnd thanks to an unexpected ally, he just might have a chance.\r\n\r\nPart scientific mystery, part dazzling interstellar journey, Project Hail Mary is a tale of discovery, speculation, and survival to rival The Martian - while taking us to places it never dreamed of going.\r\n\r\nPLEASE NOTE: To accommodate this audio edition, some changes to the original text have been made with the approval of author Andy Weir.\r\n\r\n\u00a92021 Andy Weir (P)2021 Audible Studios",
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f81',
      title: 'PThe Myth of Normal',
      subtitle: 'Trauma, Illness, and Healing in a Toxic Culture',
      cast: 'Gabor Maté, Daniel Maté',
      narrator: 'Daniel Maté',
      runtime: '18 hrs and 12 mins',
      year: '09-13-22',
      image: require('../assets/images/books/418C1ltYduL._SL500_.jpg'),
      starRating: '4.5',
      rating: 'English',
      genre: 'Public Health, Post-Traumatic Stress Disorders, Psychology',
      summary:
        'By the acclaimed author of In the Realm of Hungry Ghosts, a groundbreaking investigation into the causes of illness, a bracing critique of how our society breeds disease, and a pathway to health and healing.\r\n\r\nIn this revolutionary book, renowned physician Gabor Mat\u00e9 eloquently dissects how in Western countries that pride themselves on their healthcare systems, chronic illness and general ill health are on the rise. Nearly 70 percent of Americans are on at least one prescription drug; more than half take two. In Canada, every fifth person has high blood pressure. In Europe, hypertension is diagnosed in more than 30 percent of the population. And everywhere, adolescent mental illness is on the rise. So what is really \u201cnormal\u201d when it comes to health?\r\n\r\nOver four decades of clinical experience, Mat\u00e9 has come to recognize the prevailing understanding of \u201cnormal\u201d as false, neglecting the roles that trauma and stress, and the pressures of modern-day living, exert on our bodies and our minds at the expense of good health. For all our expertise and technological sophistication, Western medicine often fails to treat the whole person, ignoring how today\u2019s culture stresses the body, burdens the immune system, and undermines emotional balance. Now Mat\u00e9 brings his perspective to the great untangling of common myths about what makes us sick, connects the dots between the maladies of individuals and the declining soundness of society\u2014and offers a compassionate guide for health and healing. Cowritten with his son Daniel, The Myth of Normal is Mat\u00e9\u2019s most ambitious and urgent book yet.\r\n\r\n\u00a92022 Gabor Mat\u00e9 and Daniel Mat\u00e9 (P)2022 Penguin Audio',
    },
  ];
};

const state = {
  fetchCurrentlyListen: [
    {
      id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
      title: 'Becoming',
      author: 'Michelle Obama',
      naratedby: 'Michelle Obama',
      cover_url: require('../assets/images/books/51QMk4Lt1kL.jpg'),
      length: '19h 3m',
      timeStamp: '3h',
      updated_at: 'August 03, 2022',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
      title: 'The Moment of Lift How Empowering Women Changes the World',
      author: 'Melinda Gates',
      naratedby: 'Melinda Gates',
      cover_url: require('../assets/images/books/41k+OevSHfL.jpg'),
      length: '8h 9m',
      timeStamp: '5h',
      updated_at: 'July 19, 2022',
    },
  ],

  recommended: [
    {
      id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
      title: 'Outliers The Story of Success',
      cover_url: require('../assets/images/books/41NOnaoU9sL.jpg'),
      author: 'Malcolm Gladwell',
      rating: 4.95,
    },
    {
      id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28bc',
      title: 'Bad Blood Secrets and Lies in a Silicon Valley Startup',
      cover_url: require('../assets/images/books/41AbpgAXGoL.jpg'),
      author: 'John Carreyrou',
      rating: 4.5,
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
      title: 'Homo Deus A Brief History of Tomorrow',
      cover_url: require('../assets/images/books/51KkLSCnslL.jpg'),
      author: 'Yuval Noah Harari',
      rating: 4.5,
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f64',
      title:
        'The Subtle Art of Not Giving a F*ck A Counterintuitive Approach to Living a Good Life',
      cover_url: require('../assets/images/books/51MT0MbpD7L.jpg'),
      author: 'Mark Manson',
      rating: 4.5,
    },
  ],

  genres: [
    {
      id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
      genre: 'Non fiction',
      cover_url: require('../assets/images/books/51MT0MbpD7L.jpg'),
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
      genre: 'Self help',
      cover_url: require('../assets/images/books/61zWb3xvBBL.jpg'),
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f64',
      genre: 'Science',
      cover_url: require('../assets/images/books/61j+AB3GUoL.jpg'),
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f65',
      genre: 'Business',
      cover_url: require('../assets/images/books/51xWgLZHDCL.jpg'),
    },
  ],

  authors: [
    {
      id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
      name: 'Mark Manson',
      avatar: require('../assets/images/avatar/Memoji-01.png'),
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
      name: 'Yuval Noah Harari',
      avatar: require('../assets/images/avatar/Memoji-17.png'),
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f64',
      name: 'John Carreyrou',
      avatar: require('../assets/images/avatar/Memoji-18.png'),
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f65',
      name: 'Malcolm Gladwell',
      avatar: require('../assets/images/avatar/Memoji-01.png'),
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f66',
      name: 'Melinda Gates',
      avatar: require('../assets/images/avatar/Memoji-17.png'),
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f67',
      name: 'Michelle Obama',
      avatar: require('../assets/images/avatar/Memoji-18.png'),
    },
  ],

  shelves: [
    {
      id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
      title: 'Currently listening',
      count: 2,
      books: [
        {
          id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f66',
          title: 'Becoming',
          cover_url: require('../assets/images/books/51QMk4Lt1kL.jpg'),
        },
        {
          id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f66',
          title: 'The Moment of Lift How Empowering Women Changes the World',
          cover_url: require('../assets/images/books/41k+OevSHfL.jpg'),
        },
      ],
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
      title: 'Wanna to listen',
      count: 5,
      books: [
        {
          id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f66',
          title: 'Wanna to listen',
          cover_url: require('../assets/images/avatar/Memoji-17.png'),
        },
      ],
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f64',
      title: 'Listened',
      count: 20,
      books: [
        {
          id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f66',
          title: 'Wanna to listen',
          cover_url: require('../assets/images/avatar/Memoji-17.png'),
        },
      ],
    },
  ],

  tags: [
    {
      id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
      name: 'Business',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
      name: 'Memoir',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f64',
      name: 'Fiction',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f65',
      name: 'None Fiction',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f66',
      name: 'Psychology',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f67',
      name: 'Science',
    },
    {
      id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f68',
      name: 'Self help',
    },
  ],
};

export default state;
