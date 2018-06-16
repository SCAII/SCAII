# Study Question Interface Documentation
## Installation
1. Install Sky-RTS
	- `https://github.com/SCAII/Sky-install`
2. Move replay file and corresponding question file to the `replays` directory.
	- Default location on windows: `C:\Users\<Windows Profile User name>\.scaii\replays`

## Filenames
```
    <Replay Filename>_questions_<Participant ID>_<Treatment Number>.txt
```
For example, a participant whose ID is `22`, designated treatment `1`, and is viewing a replay file `replay99.scr` will have a corresponding question file named `replay99_questions_22_1.txt`.

Valid treatment values are {`0`, `1`, `2`, `3`}.

## Question Format
Fields are delineated by a `;`.

| Field | Description |
| ----- | ----------- |
| 0		| Replay step number of the decision point. Determined by examining the replay in the UI. |
| 1		| Index number of the question in that list of questions for this step. Multiple questions can be asked for a step. |
| 2		| This field has three subfields, separated by colon ":" See [Field 2 Subfields](#f2-sub)
| 3		| This field contains the question text. |


### [Field 2 Subfields](#f2-sub)

| Subfield 	| Description |
| --------	| ----------- |
| 0			| Question type: `waitForClick`  or `plain`
| 1			| Names of the areas that are ok to click on in this question. The legal value of this is one or more of the following values {`gameboard`,  `rewardBar`,  `saliencyMap`}. If multiple, they are separated by underscores as follows: `gameboard_rewardBar_saliencyMap`. If the value of subfield `0` is `plain`, subfield `1` must be `NA`.
| 2			| Text telling the user what to click on. If the value of subfield `0` is `plain`, subfield `2` must be `NA`.

