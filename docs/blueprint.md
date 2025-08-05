# **App Name**: Pata Pata Panic

## Core Features:

- Race Track Display: Display a 2D race track with 5 horses represented as sprites or CSS animated elements.
- Race Initiation: Initiate the race with all horses starting simultaneously upon clicking a 'Start Race' button.
- Horse Advancement: Randomly advance each horse at regular intervals, with a chance (e.g., 20%) of a horse 'breaking a leg' and stopping permanently. Use randomness as a tool, but constrain the randomness such that races end with results reasonably close to the user's expectations.
- Player Betting: Allow the player to choose a horse before starting the race and to exit their bet at any time using a 'Cash Out' button.
- Score System: Calculate and display the player's score based on the distance their chosen horse ran before the player cashed out, awarding maximum points if the horse wins, and no points if the horse breaks a leg before cashing out.
- Visual Leg Break Indicator: Visually indicate a horse breaking its leg with a distinct marker, such as an 'X' or similar symbol.
- Race Progress and Score Display: Implement an animated progress bar for each horse and a real-time point counter to dynamically display the score.

## Style Guidelines:

- Primary color: Vibrant Purple (#A020F0) to invoke excitement and fun.
- Background color: Light Lavender (#E6E6FA), offering a soft, desaturated backdrop.
- Accent color: Electric Blue (#7DF9FF), to highlight interactive elements such as buttons and progress bars.
- Body and headline font: 'Space Grotesk', sans-serif. Suitable for headlines and short amounts of body text. If longer text is anticipated, use this for headlines and 'Inter' for body
- Employ clean and simple icons to represent game actions (start, cash out, restart) and horse status (running, broken leg).
- Use subtle transitions and movements for horses and interface elements. Consider subtle animations using CSS or Framer Motion for interactive components, without overwhelming the user.
- A clean, intuitive layout to emphasize real-time information during gameplay. Clear sections to display the horses’ progress, player's score, and betting options.