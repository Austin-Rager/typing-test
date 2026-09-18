# Typing Test

This app is built using expo and react native.

## The features

The first is the home screen. It is bare bones with only the start option. There are settings at the bottom for changing word count, whether you want timed or a select amount of words. Including an option for a code snippet.

The second is the actual test screen. It has the options that you put on the top of the screen. It shows the test with words, and as you type it'll give you live feedback of where you are, what you got wrong and shows haptic feedback when you get a letter wrong.

The third screen is the results screen. It shows your WPM, accuracy, error count and characters typed. It shows a return to home button and a try again button.

## Extra expo packages

I used expo-font for the jetbrains mono font.
expo-haptics was used to buzz whenever you get a letter wrong and when the test finishes.

## Getting started
 
```bash
npm install
npx expo start
```

## Author

Austin Rager - SE-3010
