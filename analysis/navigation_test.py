import unittest

from flatten import parse_line
import extractionMap as extractionMap
# stepIntoDecisionPoint:                      "tutorial.scr,9-13-2018,12:9:0:335,1536865740335,undefined,undefined,stepIntoDecisionPoint:1,false,false,false,false,false,false"
# timelineClick:                              "tutorial.scr,9-13-2018,13:59:37:648,1536872377648,75,75.2,userClick:328_401;region:gameArea;target:expl-control-canvas;timelineClick:106,false,false,false,false,false,false"

# jumpToDecisionPoint:                        "tutorial.scr,9-13-2018,16:29:14:251,1536881354251,75,75.2,userClick:245_406;region:gameArea;target:decisionPointList;jumpToDecisionPoint:75,false,false,false,false,false,false"

# clickTimeLineBlocker:                       "tutorial.scr,9-13-2018,13:55:13:920,1536872113920,1,1.2,userClick:301_422;region:gameArea;target:right-block-div;clickTimeLineBlocker:NA,false,false,false,false,false,false"
# play:                                       "tutorial.scr,9-13-2018,13:46:10:103,1536871570103,1,1.0,userClick:486_337;region:gameArea;target:pauseResumeButton;play:NA,false,false,false,false,false,false"
# pause:                                      "tutorial.scr,9-13-2018,13:46:11:665,1536871571665,1,1.0,userClick:481_341;region:gameArea;target:pauseResumeButton;pause:NA,false,false,false,false,false,false"
# touchStepProgressLabel:                     "tutorial.scr,9-13-2018,13:57:30:581,1536872250581,75,75.2,userClick:70_337;region:gameArea;target:step-value;touchStepProgressLabel:NA,false,false,false,false,false,false"

class TestFlatteningNavigation(unittest.TestCase):

    def test_stepIntoDecisionPoint(self):
        line = "tutorial.scr,9-13-2018,12:9:0:335,1536865740335,undefined,undefined,stepIntoDecisionPoint:1,false,false,false,false,false,false"
        extraction_map = extractionMap.get_extraction_map()
        obj = parse_line(line,extraction_map)
        self.assertEqual(obj["stepIntoDecisionPoint"], "1")
        self.assertEqual(obj["showQuestion"], "NA")
        self.assertEqual(obj["hideEntityTooltips"], "NA")
        self.assertEqual(obj["showEntityTooltip.entityInfo"], "NA")
        self.assertEqual(obj["showEntityTooltip.tipQuadrant"], "NA")
        self.assertEqual(obj["startMouseOverSaliencyMap"], "NA")
        self.assertEqual(obj["endMouseOverSaliencyMap"], "NA")

        self.assertEqual(obj["userClick.coordX"], "NA")
        self.assertEqual(obj["userClick.coordY"], "NA")
        self.assertEqual(obj["userClick.region"], "NA")
        self.assertEqual(obj["userClick.target"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.clickStep"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.questionIndex"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.answer1"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.answer2"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.fileName"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.date"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.time"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.1970Sec"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.decisionPoint"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.questionId"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.coordX"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.coordY"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.region"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.target"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.clickQuadrant"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.coordX"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.coordY"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick.selectedRewardBar"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick.clickSaliencyMap"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickSaliencyMap.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickSaliencyMap.clickQuadrant"], "NA")

        self.assertEqual(obj["userClick.timelineClick"], "NA")
        self.assertEqual(obj["userClick.jumpToDecisionPoint"], "NA")
        self.assertEqual(obj["userClick.clickTimeLineBlocker"], "NA")
        self.assertEqual(obj["userClick.play"], "NA")
        self.assertEqual(obj["userClick.pause"], "NA")
        self.assertEqual(obj["userClick.touchStepProgressLabel"], "NA")
        self.assertEqual(obj["userClick.clickGameQuadrant"], "NA")

        self.assertEqual(obj["userClick.clickEntity.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.clickEntity.clickQuadrant"], "NA")
        self.assertEqual(obj["userClick.clickEntity.coordX"], "NA")
        self.assertEqual(obj["userClick.clickEntity.coordY"], "NA")

        self.assertEqual(obj["userClick.clickActionLabel"], "NA")
        self.assertEqual(obj["userClick.clickActionLabelDenied"], "NA")
        self.assertEqual(obj["userClick.selectedRewardBar"], "NA")

        self.assertEqual(obj["userClick.clickSaliencyMap"], "NA")
        self.assertEqual(obj["userClick.clickSaliencyMap.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.clickSaliencyMap.clickQuadrant"], "NA")

        self.assertEqual(obj["userClick.touchCumRewardLabel"], "NA")
        self.assertEqual(obj["userClick.touchCumRewardValueFor"], "NA")

    def test_timelineClick(self):
        line = "tutorial.scr,9-13-2018,13:59:37:648,1536872377648,75,75.2,userClick:328_401;region:gameArea;target:expl-control-canvas;timelineClick:106,false,false,false,false,false,false"
        extraction_map = extractionMap.get_extraction_map()
        obj = parse_line(line,extraction_map)
        self.assertEqual(obj["stepIntoDecisionPoint"], "NA")
        self.assertEqual(obj["showQuestion"], "NA")
        self.assertEqual(obj["hideEntityTooltips"], "NA")
        self.assertEqual(obj["showEntityTooltip.entityInfo"], "NA")
        self.assertEqual(obj["showEntityTooltip.tipQuadrant"], "NA")
        self.assertEqual(obj["startMouseOverSaliencyMap"], "NA")
        self.assertEqual(obj["endMouseOverSaliencyMap"], "NA")

        self.assertEqual(obj["userClick.coordX"], "328")
        self.assertEqual(obj["userClick.coordY"], "401")
        self.assertEqual(obj["userClick.region"], "gameArea")
        self.assertEqual(obj["userClick.target"], "expl-control-canvas")
        self.assertEqual(obj["userClick.answerQuestion.clickStep"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.questionIndex"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.answer1"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.answer2"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.fileName"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.date"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.time"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.1970Sec"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.decisionPoint"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.questionId"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.coordX"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.coordY"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.region"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.target"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.clickQuadrant"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.coordX"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.coordY"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick.selectedRewardBar"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick.clickSaliencyMap"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickSaliencyMap.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickSaliencyMap.clickQuadrant"], "NA")

        self.assertEqual(obj["userClick.timelineClick"], "106")
        self.assertEqual(obj["userClick.jumpToDecisionPoint"], "NA")
        self.assertEqual(obj["userClick.clickTimeLineBlocker"], "NA")
        self.assertEqual(obj["userClick.play"], "NA")
        self.assertEqual(obj["userClick.pause"], "NA")
        self.assertEqual(obj["userClick.touchStepProgressLabel"], "NA")
        self.assertEqual(obj["userClick.clickGameQuadrant"], "NA")

        self.assertEqual(obj["userClick.clickEntity.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.clickEntity.clickQuadrant"], "NA")
        self.assertEqual(obj["userClick.clickEntity.coordX"], "NA")
        self.assertEqual(obj["userClick.clickEntity.coordY"], "NA")

        self.assertEqual(obj["userClick.clickActionLabel"], "NA")
        self.assertEqual(obj["userClick.clickActionLabelDenied"], "NA")
        self.assertEqual(obj["userClick.selectedRewardBar"], "NA")

        self.assertEqual(obj["userClick.clickSaliencyMap"], "NA")
        self.assertEqual(obj["userClick.clickSaliencyMap.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.clickSaliencyMap.clickQuadrant"], "NA")

        self.assertEqual(obj["userClick.touchCumRewardLabel"], "NA")
        self.assertEqual(obj["userClick.touchCumRewardValueFor"], "NA")

    def test_jumpToDecisionPoint(self):
        line = "tutorial.scr,9-13-2018,16:29:14:251,1536881354251,75,75.2,userClick:245_406;region:gameArea;target:decisionPointList;jumpToDecisionPoint:75,false,false,false,false,false,false"
        extraction_map = extractionMap.get_extraction_map()
        obj = parse_line(line,extraction_map)
        self.assertEqual(obj["stepIntoDecisionPoint"], "NA")
        self.assertEqual(obj["showQuestion"], "NA")
        self.assertEqual(obj["hideEntityTooltips"], "NA")
        self.assertEqual(obj["showEntityTooltip.entityInfo"], "NA")
        self.assertEqual(obj["showEntityTooltip.tipQuadrant"], "NA")
        self.assertEqual(obj["startMouseOverSaliencyMap"], "NA")
        self.assertEqual(obj["endMouseOverSaliencyMap"], "NA")

        self.assertEqual(obj["userClick.coordX"], "245")
        self.assertEqual(obj["userClick.coordY"], "406")
        self.assertEqual(obj["userClick.region"], "gameArea")
        self.assertEqual(obj["userClick.target"], "decisionPointList")
        self.assertEqual(obj["userClick.answerQuestion.clickStep"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.questionIndex"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.answer1"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.answer2"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.fileName"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.date"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.time"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.1970Sec"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.decisionPoint"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.questionId"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.coordX"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.coordY"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.region"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.target"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.clickQuadrant"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.coordX"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.coordY"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick.selectedRewardBar"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick.clickSaliencyMap"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickSaliencyMap.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickSaliencyMap.clickQuadrant"], "NA")

        self.assertEqual(obj["userClick.timelineClick"], "NA")
        self.assertEqual(obj["userClick.jumpToDecisionPoint"], "75")
        self.assertEqual(obj["userClick.clickTimeLineBlocker"], "NA")
        self.assertEqual(obj["userClick.play"], "NA")
        self.assertEqual(obj["userClick.pause"], "NA")
        self.assertEqual(obj["userClick.touchStepProgressLabel"], "NA")
        self.assertEqual(obj["userClick.clickGameQuadrant"], "NA")

        self.assertEqual(obj["userClick.clickEntity.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.clickEntity.clickQuadrant"], "NA")
        self.assertEqual(obj["userClick.clickEntity.coordX"], "NA")
        self.assertEqual(obj["userClick.clickEntity.coordY"], "NA")

        self.assertEqual(obj["userClick.clickActionLabel"], "NA")
        self.assertEqual(obj["userClick.clickActionLabelDenied"], "NA")
        self.assertEqual(obj["userClick.selectedRewardBar"], "NA")

        self.assertEqual(obj["userClick.clickSaliencyMap"], "NA")
        self.assertEqual(obj["userClick.clickSaliencyMap.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.clickSaliencyMap.clickQuadrant"], "NA")

        self.assertEqual(obj["userClick.touchCumRewardLabel"], "NA")
        self.assertEqual(obj["userClick.touchCumRewardValueFor"], "NA")

    def test_clickTimeLineBlocker(self):
        print("THIS ONE")
        line = "tutorial.scr,9-13-2018,13:55:13:920,1536872113920,1,1.2,userClick:301_422;region:gameArea;target:right-block-div;clickTimeLineBlocker:NA,false,false,false,false,false,false"
        extraction_map = extractionMap.get_extraction_map()
        obj = parse_line(line,extraction_map)
        self.assertEqual(obj["stepIntoDecisionPoint"], "NA")
        self.assertEqual(obj["showQuestion"], "NA")
        self.assertEqual(obj["hideEntityTooltips"], "NA")
        self.assertEqual(obj["showEntityTooltip.entityInfo"], "NA")
        self.assertEqual(obj["showEntityTooltip.tipQuadrant"], "NA")
        self.assertEqual(obj["startMouseOverSaliencyMap"], "NA")
        self.assertEqual(obj["endMouseOverSaliencyMap"], "NA")

        self.assertEqual(obj["userClick.coordX"], "301")
        self.assertEqual(obj["userClick.coordY"], "422")
        self.assertEqual(obj["userClick.region"], "gameArea")
        self.assertEqual(obj["userClick.target"], "right-block-div")
        self.assertEqual(obj["userClick.answerQuestion.clickStep"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.questionIndex"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.answer1"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.answer2"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.fileName"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.date"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.time"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.1970Sec"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.decisionPoint"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.questionId"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.coordX"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.coordY"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.region"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.target"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.clickQuadrant"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.coordX"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.coordY"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick.selectedRewardBar"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick.clickSaliencyMap"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickSaliencyMap.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickSaliencyMap.clickQuadrant"], "NA")

        self.assertEqual(obj["userClick.timelineClick"], "NA")
        self.assertEqual(obj["userClick.jumpToDecisionPoint"], "NA")
        self.assertEqual(obj["userClick.clickTimeLineBlocker"], "yes")
        self.assertEqual(obj["userClick.play"], "NA")
        self.assertEqual(obj["userClick.pause"], "NA")
        self.assertEqual(obj["userClick.touchStepProgressLabel"], "NA")
        self.assertEqual(obj["userClick.clickGameQuadrant"], "NA")

        self.assertEqual(obj["userClick.clickEntity.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.clickEntity.clickQuadrant"], "NA")
        self.assertEqual(obj["userClick.clickEntity.coordX"], "NA")
        self.assertEqual(obj["userClick.clickEntity.coordY"], "NA")

        self.assertEqual(obj["userClick.clickActionLabel"], "NA")
        self.assertEqual(obj["userClick.clickActionLabelDenied"], "NA")
        self.assertEqual(obj["userClick.selectedRewardBar"], "NA")

        self.assertEqual(obj["userClick.clickSaliencyMap"], "NA")
        self.assertEqual(obj["userClick.clickSaliencyMap.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.clickSaliencyMap.clickQuadrant"], "NA")

        self.assertEqual(obj["userClick.touchCumRewardLabel"], "NA")
        self.assertEqual(obj["userClick.touchCumRewardValueFor"], "NA")

    def test_play(self):
        line = "tutorial.scr,9-13-2018,13:46:10:103,1536871570103,1,1.0,userClick:486_337;region:gameArea;target:pauseResumeButton;play:NA,false,false,false,false,false,false"
        extraction_map = extractionMap.get_extraction_map()
        obj = parse_line(line,extraction_map)
        self.assertEqual(obj["stepIntoDecisionPoint"], "NA")
        self.assertEqual(obj["showQuestion"], "NA")
        self.assertEqual(obj["hideEntityTooltips"], "NA")
        self.assertEqual(obj["showEntityTooltip.entityInfo"], "NA")
        self.assertEqual(obj["showEntityTooltip.tipQuadrant"], "NA")
        self.assertEqual(obj["startMouseOverSaliencyMap"], "NA")
        self.assertEqual(obj["endMouseOverSaliencyMap"], "NA")

        self.assertEqual(obj["userClick.coordX"], "486")
        self.assertEqual(obj["userClick.coordY"], "337")
        self.assertEqual(obj["userClick.region"], "gameArea")
        self.assertEqual(obj["userClick.target"], "pauseResumeButton")
        self.assertEqual(obj["userClick.answerQuestion.clickStep"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.questionIndex"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.answer1"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.answer2"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.fileName"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.date"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.time"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.1970Sec"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.decisionPoint"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.questionId"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.coordX"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.coordY"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.region"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.target"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.clickQuadrant"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.coordX"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.coordY"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick.selectedRewardBar"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick.clickSaliencyMap"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickSaliencyMap.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickSaliencyMap.clickQuadrant"], "NA")

        self.assertEqual(obj["userClick.timelineClick"], "NA")
        self.assertEqual(obj["userClick.jumpToDecisionPoint"], "NA")
        self.assertEqual(obj["userClick.clickTimeLineBlocker"], "NA")
        self.assertEqual(obj["userClick.play"], "yes")
        self.assertEqual(obj["userClick.pause"], "NA")
        self.assertEqual(obj["userClick.touchStepProgressLabel"], "NA")
        self.assertEqual(obj["userClick.clickGameQuadrant"], "NA")

        self.assertEqual(obj["userClick.clickEntity.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.clickEntity.clickQuadrant"], "NA")
        self.assertEqual(obj["userClick.clickEntity.coordX"], "NA")
        self.assertEqual(obj["userClick.clickEntity.coordY"], "NA")

        self.assertEqual(obj["userClick.clickActionLabel"], "NA")
        self.assertEqual(obj["userClick.clickActionLabelDenied"], "NA")
        self.assertEqual(obj["userClick.selectedRewardBar"], "NA")

        self.assertEqual(obj["userClick.clickSaliencyMap"], "NA")
        self.assertEqual(obj["userClick.clickSaliencyMap.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.clickSaliencyMap.clickQuadrant"], "NA")

        self.assertEqual(obj["userClick.touchCumRewardLabel"], "NA")
        self.assertEqual(obj["userClick.touchCumRewardValueFor"], "NA")

    def test_pause(self):
        line = "tutorial.scr,9-13-2018,13:46:11:665,1536871571665,1,1.0,userClick:481_341;region:gameArea;target:pauseResumeButton;pause:NA,false,false,false,false,false,false"
        extraction_map = extractionMap.get_extraction_map()
        obj = parse_line(line,extraction_map)
        self.assertEqual(obj["stepIntoDecisionPoint"], "NA")
        self.assertEqual(obj["showQuestion"], "NA")
        self.assertEqual(obj["hideEntityTooltips"], "NA")
        self.assertEqual(obj["showEntityTooltip.entityInfo"], "NA")
        self.assertEqual(obj["showEntityTooltip.tipQuadrant"], "NA")
        self.assertEqual(obj["startMouseOverSaliencyMap"], "NA")
        self.assertEqual(obj["endMouseOverSaliencyMap"], "NA")

        self.assertEqual(obj["userClick.coordX"], "481")
        self.assertEqual(obj["userClick.coordY"], "341")
        self.assertEqual(obj["userClick.region"], "gameArea")
        self.assertEqual(obj["userClick.target"], "pauseResumeButton")
        self.assertEqual(obj["userClick.answerQuestion.clickStep"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.questionIndex"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.answer1"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.answer2"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.fileName"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.date"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.time"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.1970Sec"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.decisionPoint"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.questionId"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.coordX"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.coordY"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.region"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.target"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.clickQuadrant"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.coordX"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.coordY"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick.selectedRewardBar"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick.clickSaliencyMap"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickSaliencyMap.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickSaliencyMap.clickQuadrant"], "NA")

        self.assertEqual(obj["userClick.timelineClick"], "NA")
        self.assertEqual(obj["userClick.jumpToDecisionPoint"], "NA")
        self.assertEqual(obj["userClick.clickTimeLineBlocker"], "NA")
        self.assertEqual(obj["userClick.play"], "NA")
        self.assertEqual(obj["userClick.pause"], "yes")
        self.assertEqual(obj["userClick.touchStepProgressLabel"], "NA")
        self.assertEqual(obj["userClick.clickGameQuadrant"], "NA")

        self.assertEqual(obj["userClick.clickEntity.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.clickEntity.clickQuadrant"], "NA")
        self.assertEqual(obj["userClick.clickEntity.coordX"], "NA")
        self.assertEqual(obj["userClick.clickEntity.coordY"], "NA")

        self.assertEqual(obj["userClick.clickActionLabel"], "NA")
        self.assertEqual(obj["userClick.clickActionLabelDenied"], "NA")
        self.assertEqual(obj["userClick.selectedRewardBar"], "NA")

        self.assertEqual(obj["userClick.clickSaliencyMap"], "NA")
        self.assertEqual(obj["userClick.clickSaliencyMap.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.clickSaliencyMap.clickQuadrant"], "NA")

        self.assertEqual(obj["userClick.touchCumRewardLabel"], "NA")
        self.assertEqual(obj["userClick.touchCumRewardValueFor"], "NA")

    def test_touchStepProgressLabel(self):
        line = "tutorial.scr,9-13-2018,13:57:30:581,1536872250581,75,75.2,userClick:70_337;region:gameArea;target:step-value;touchStepProgressLabel:NA,false,false,false,false,false,false"
        extraction_map = extractionMap.get_extraction_map()
        obj = parse_line(line,extraction_map)
        self.assertEqual(obj["stepIntoDecisionPoint"], "NA")
        self.assertEqual(obj["showQuestion"], "NA")
        self.assertEqual(obj["hideEntityTooltips"], "NA")
        self.assertEqual(obj["showEntityTooltip.entityInfo"], "NA")
        self.assertEqual(obj["showEntityTooltip.tipQuadrant"], "NA")
        self.assertEqual(obj["startMouseOverSaliencyMap"], "NA")
        self.assertEqual(obj["endMouseOverSaliencyMap"], "NA")

        self.assertEqual(obj["userClick.coordX"], "70")
        self.assertEqual(obj["userClick.coordY"], "337")
        self.assertEqual(obj["userClick.region"], "gameArea")
        self.assertEqual(obj["userClick.target"], "step-value")
        self.assertEqual(obj["userClick.answerQuestion.clickStep"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.questionIndex"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.answer1"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.answer2"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.fileName"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.date"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.time"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.1970Sec"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.decisionPoint"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.questionId"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.coordX"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.coordY"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.region"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.target"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.clickQuadrant"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.coordX"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.coordY"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick.selectedRewardBar"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick.clickSaliencyMap"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickSaliencyMap.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickSaliencyMap.clickQuadrant"], "NA")

        self.assertEqual(obj["userClick.timelineClick"], "NA")
        self.assertEqual(obj["userClick.jumpToDecisionPoint"], "NA")
        self.assertEqual(obj["userClick.clickTimeLineBlocker"], "NA")
        self.assertEqual(obj["userClick.play"], "NA")
        self.assertEqual(obj["userClick.pause"], "NA")
        self.assertEqual(obj["userClick.touchStepProgressLabel"], "yes")
        self.assertEqual(obj["userClick.clickGameQuadrant"], "NA")

        self.assertEqual(obj["userClick.clickEntity.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.clickEntity.clickQuadrant"], "NA")
        self.assertEqual(obj["userClick.clickEntity.coordX"], "NA")
        self.assertEqual(obj["userClick.clickEntity.coordY"], "NA")

        self.assertEqual(obj["userClick.clickActionLabel"], "NA")
        self.assertEqual(obj["userClick.clickActionLabelDenied"], "NA")
        self.assertEqual(obj["userClick.selectedRewardBar"], "NA")

        self.assertEqual(obj["userClick.clickSaliencyMap"], "NA")
        self.assertEqual(obj["userClick.clickSaliencyMap.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.clickSaliencyMap.clickQuadrant"], "NA")

        self.assertEqual(obj["userClick.touchCumRewardLabel"], "NA")
        self.assertEqual(obj["userClick.touchCumRewardValueFor"], "NA")