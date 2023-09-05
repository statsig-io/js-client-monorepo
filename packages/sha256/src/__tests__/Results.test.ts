import { sha256create } from '../js-sha256';
import { Base64 } from './Base64';
// import { SHA256 } from '../sha256';
import { sha256create as statsig_sha256create } from '../statsig-sha256';

function getExpectedHash(value: string) {
  const buffer = sha256create().update(value).arrayBuffer();
  return Base64.encodeArrayBuffer(buffer);
}

function getActualHash(value: string) {
  // const buffer = SHA256(value);
  const buffer = statsig_sha256create().update(value).arrayBuffer();

  return Base64.encodeArrayBuffer(buffer);
}

function generateRandomWordFromArray(inputArray: string[]) {
  if (inputArray.length < 3) {
    throw new Error('Array must have at least 3 elements');
  }

  const randomIndices: number[] = [];
  while (randomIndices.length < 3) {
    const randomIndex = Math.floor(Math.random() * inputArray.length);
    if (!randomIndices.includes(randomIndex)) {
      randomIndices.push(randomIndex);
    }
  }

  const randomWords = randomIndices.map((index) => inputArray[index]);
  const randomWord = randomWords.join('_');

  return randomWord;
}

function generateTestCases(count: number) {
  const words = [
    'apple',
    'banana',
    'orange',
    'grape',
    'kiwi',
    'strawberry',
    'melon',
    'carrot',
    'potato',
    'broccoli',
    'pepper',
    'tomato',
    'cucumber',
    'lettuce',
    'dog',
    'cat',
    'bird',
    'fish',
    'rabbit',
    'hamster',
    'turtle',
    'horse',
    '大',
    'بزرگ',
  ];

  const randomWords: string[] = [];

  for (let i = 0; i < count; i++) {
    const word = generateRandomWordFromArray(words);
    randomWords.push(word);
  }

  return randomWords;
}

describe('Foo', () => {
  test.each(generateTestCases(100))('%s', (word) => {
    const expected = getExpectedHash(word);
    const actual = getActualHash(word);
    expect(actual).toEqual(expected);
  });
});
