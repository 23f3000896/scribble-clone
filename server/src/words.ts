export const WORD_CATEGORIES: Record<string, string[]> = {
  animals: [
    'ant', 'alligator', 'bear', 'bat', 'bee', 'butterfly', 'camel', 'cat', 'caterpillar', 'cheetah',
    'chicken', 'chimpanzee', 'cow', 'crab', 'crocodile', 'crow', 'deer', 'dog', 'dolphin', 'donkey',
    'dragon', 'duck', 'eagle', 'elephant', 'flamingo', 'fox', 'frog', 'giraffe', 'goat', 'goldfish',
    'gorilla', 'hamster', 'hedgehog', 'hippopotamus', 'horse', 'kangaroo', 'koala', 'leopard', 'lion',
    'lizard', 'llama', 'lobster', 'monkey', 'mosquito', 'mouse', 'octopus', 'ostrich', 'otter', 'owl',
    'panda', 'parrot', 'peacock', 'penguin', 'pig', 'pigeon', 'polar bear', 'rabbit', 'raccoon', 'rhino',
    'scorpion', 'seahorse', 'seal', 'shark', 'sheep', 'skunk', 'sloth', 'snail', 'snake', 'spider',
    'squid', 'squirrel', 'starfish', 'swan', 'tiger', 'turtle', 'walrus', 'whale', 'wolf', 'zebra'
  ],
  objects: [
    'alarm clock', 'anchor', 'backpack', 'balloon', 'battery', 'bell', 'bicycle', 'binoculars', 'blanket',
    'book', 'bottle', 'bowl', 'broom', 'brush', 'bucket', 'button', 'calculator', 'calendar', 'camera',
    'candle', 'car', 'chair', 'clock', 'compass', 'computer', 'crayon', 'cup', 'curtain', 'cushion',
    'diamond', 'door', 'drum', 'envelope', 'eraser', 'fan', 'feather', 'flag', 'flashlight', 'fork',
    'glasses', 'guitar', 'hammer', 'headphones', 'helmet', 'key', 'keyboard', 'kite', 'knife', 'ladder',
    'lamp', 'laptop', 'lightbulb', 'lock', 'magnet', 'map', 'match', 'microphone', 'mirror', 'nail',
    'necklace', 'newspaper', 'padlock', 'paint', 'paperclip', 'pen', 'pencil', 'phone', 'piano', 'pillow',
    'pipe', 'plate', 'radio', 'ring', 'rocket', 'rope', 'ruler', 'scissors', 'screwdriver', 'shield',
    'shoe', 'shovel', 'soap', 'sock', 'sponge', 'spoon', 'stamp', 'stapler', 'sword', 'syringe',
    'telescope', 'television', 'tent', 'thermometer', 'toothbrush', 'towel', 'umbrella', 'vase', 'watch', 'whistle'
  ],
  food: [
    'apple', 'avocado', 'bacon', 'banana', 'bread', 'broccoli', 'burger', 'butter', 'cake', 'candy',
    'carrot', 'cheese', 'cherry', 'chocolate', 'cookie', 'corn', 'croissant', 'cupcake', 'donut', 'egg',
    'fish', 'french fries', 'grapes', 'hamburger', 'honey', 'hot dog', 'ice cream', 'jelly', 'kiwi',
    'lemon', 'lettuce', 'lollipop', 'mango', 'meatball', 'milk', 'muffin', 'mushroom', 'noodles', 'onion',
    'orange', 'pancake', 'pasta', 'peach', 'peanut', 'pear', 'pepper', 'pickle', 'pie', 'pineapple',
    'pizza', 'popcorn', 'potato', 'pretzel', 'pumpkin', 'rice', 'salad', 'sandwich', 'sausage', 'soup',
    'spaghetti', 'steak', 'strawberry', 'sushi', 'taco', 'toast', 'tomato', 'waffle', 'watermelon', 'yogurt'
  ],
  actions: [
    'bark', 'bite', 'bounce', 'clap', 'climb', 'cook', 'cough', 'crawl', 'cry', 'dance',
    'dive', 'draw', 'drink', 'drive', 'eat', 'fall', 'fight', 'fish', 'fly', 'hug',
    'jump', 'kick', 'kiss', 'laugh', 'listen', 'paint', 'read', 'run', 'scream', 'sing',
    'sit', 'skate', 'sleep', 'smile', 'sneeze', 'swim', 'think', 'throw', 'walk', 'wave',
    'whisper', 'whistle', 'wink', 'write', 'yawn'
  ],
  places_nature: [
    'beach', 'bridge', 'cave', 'castle', 'cloud', 'desert', 'fire', 'forest', 'galaxy', 'hill',
    'house', 'island', 'jungle', 'lake', 'lightning', 'moon', 'mountain', 'ocean', 'park', 'pyramid',
    'rainbow', 'river', 'road', 'sky', 'snow', 'space', 'star', 'storm', 'sun', 'tornado',
    'tower', 'tree', 'tunnel', 'volcano', 'waterfall', 'wind'
  ]
};

// Combine all words
export const ALL_WORDS = [
  ...new Set([
    ...WORD_CATEGORIES.animals,
    ...WORD_CATEGORIES.objects,
    ...WORD_CATEGORIES.food,
    ...WORD_CATEGORIES.actions,
    ...WORD_CATEGORIES.places_nature
  ])
];

export function getRandomWords(count: number, category: string = 'All', customWords: string[] = []): string[] {
  let pool: string[] = [];

  const lowerCat = category.toLowerCase();
  if (lowerCat === 'custom' && customWords && customWords.length > 0) {
    pool = customWords;
  } else if (lowerCat in WORD_CATEGORIES) {
    pool = WORD_CATEGORIES[lowerCat];
  } else {
    pool = ALL_WORDS;
  }

  if (customWords && customWords.length > 0 && lowerCat !== 'custom') {
    pool = [...new Set([...pool, ...customWords])];
  }

  // Shuffle and pick unique words
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
