# Installation
1. Install Sky-RTS
	- `https://github.com/SCAII/Sky-install`
2. Move replay file and corresponding question file to the `replays` directory.
	- Default location on windows: `C:\Users\<Windows Profile User name>\.scaii\replays`

# Filenames
```
    <Replay Filename>_questions_<Participant ID>_<Treatment Number>.txt
```
For example, a participant whose ID is `22`, designated treatment `1`, and is viewing a replay file `replay99.scr` will have a corresponding question file named `replay99_questions_22_1.txt`.

Valid treatment values are `0, 1, 2, 3`.

# Question File Format
Fields are delineated by a `;`.
| Field 0 | Field 1 | Field 2 | Field 3 |
| --- | --- | --- | --- |
| Replay step number of the decision point. Determined by examining the replay in the UI.  | Index number of the question in that list of questions for this step. Multiple questions can be asked for a step. | This field has three subfields, separated by colon ":". See #P1 | text for the question that is being asked at this screens |

## P1
		    subfield 0 -   question type - can be "waitForClick"  or "plain" 
			
			subfield 1 -   names of the areas that are ok to click on in this question
					the legal value of this is one or more of these value -  gameboard  rewardBar  saliencyMap
					if multiple, they are selarated by underscores "_"  like this - gameboard_rewardBar_saliencyMap
					
					if the value of subfield 0 is "plain", subfield 1 must be "NA"
					
		    subfield 2 -   text telling the user what to click on
					if the value of subfield 0 is "plain", subfield 2 must be "NA"