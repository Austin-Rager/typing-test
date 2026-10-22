# Typing Test

This app is built using expo and react native.

<img width="2048" height="1536" alt="IMG_4722" src="https://github.com/user-attachments/assets/ee05e178-824d-4480-9800-c2eafb7cb706" />

## The features

The first is the home screen. It is bare bones with only the start option. There are settings at the bottom for changing word count, whether you want timed or a select amount of words. Including an option for a code snippet.

<img width="585" height="1266" alt="IMG_4723" src="https://github.com/user-attachments/assets/91803463-5c62-4e3b-9f37-aef9b149846b" />

The second is the actual test screen. It has the options that you put on the top of the screen. It shows the test with words, and as you type it'll give you live feedback of where you are, what you got wrong and shows haptic feedback when you get a letter wrong.

<img width="585" height="1266" alt="IMG_4725" src="https://github.com/user-attachments/assets/d5f255ce-9997-4951-b204-23cf30f21c79" />

The third screen is the results screen. It shows your WPM, accuracy, error count and characters typed. It shows a return to home button and a try again button.

<img width="585" height="1266" alt="IMG_4724" src="https://github.com/user-attachments/assets/fd333784-adb7-40d0-9623-e130c88fd807" />

## Extra expo packages

I used expo-font for the jetbrains mono font.
expo-haptics was used to buzz whenever you get a letter wrong and when the test finishes.

## Getting started

```bash
npm install
npx expo start
```

# Next Part of Project (Project 2) 10-11-2026

## Features to be implemeted

### Navigation and structure

- Bottom tab bar with Test, History, Texts and Settings
- Code split into reusable components (OptionButton, StatBox, HistoryItem, TextCard, TabBar, typing display)

### Local data storage

- Every finished test is saved to the device (WPM, accuracy, errors, date, mode, text style)
- Custom texts you create are saved to the device
- Settings are saved so they survive closing the app

### History screen

- Best, average and total-test summary cards
- Line chart of WPM over time
- List of past tests
- Swipe to delete a test, and a clear-history option

## Implement Gyroscope

Implmenet a functionality that takes information from the gyroscope feature that can show the user how much they shake or move their phone and display that information to them.

## Author

Austin Rager - SE-3010
