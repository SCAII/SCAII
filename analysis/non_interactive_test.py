import unittest
from flatten import parse_line
import extractionMap as extractionMap
# userClick:                                  "tutorial.scr,9-13-2018,12:16:12:890,1536866172890,1,1.0,userClick:297_639;region:QnA;NA;NA,false,false,false,false,false,false"
# clickActionLabel:                           "tutorial.scr,9-13-2018,13:58:54:296,1536872334296,75,75.2,userClick:476_477;region:gameArea;target:actionLabel-step-75-action-AttackQ4;clickActionLabel:D2ESCAPED-COLON Attack Q4,false,false,false,false,false,false"
# clickActionLabelDenied:                     "tutorial.scr,9-13-2018,12:22:39:120,1536866559120,1,1.0,userClick:469_478;region:gameArea;target:actionLabel-step-75-action-AttackQ4;clickActionLabelDenied:D2ESCAPED-COLON Attack Q4,false,false,false,false,false,false"  
# touchCumRewardLabel:                        "tutorial.scr,9-13-2018,13:48:47:455,1536871727455,1,1.0,userClick:85_80;region:gameArea;target:null;touchCumRewardLabel:total score,false,false,false,false,false,false"
# touchCumRewardValueFor:                     "tutorial.scr,9-13-2018,13:49:23:343,1536871763343,1,1.0,userClick:206_75;region:gameArea;target:rewardtotalscore;touchCumRewardValueFor:total score,false,false,false,false,false,false"

class TestFlatteningNonInteractive(unittest.TestCase):

    def test_userClick(self):
        line = "tutorial.scr,9-13-2018,12:16:12:890,1536866172890,1,1.0,userClick:297_639;region:QnA;NA;NA,false,false,false,false,false,false"
        extraction_map = extractionMap.get_extraction_map()
        obj = parse_line(line,extraction_map)
        self.assertEqual(obj["stepIntoDecisionPoint"], "NA")
        self.assertEqual(obj["showQuestion"], "NA")
        self.assertEqual(obj["hideEntityTooltips"], "NA")
        self.assertEqual(obj["showEntityTooltip.entityInfo"], "NA")
        self.assertEqual(obj["showEntityTooltip.tipQuadrant"], "NA")
        self.assertEqual(obj["startMouseOverSaliencyMap"], "NA")
        self.assertEqual(obj["endMouseOverSaliencyMap"], "NA")

        self.assertEqual(obj["userClick"], "yes")
        self.assertEqual(obj["userClick.coordX"], "297")
        self.assertEqual(obj["userClick.coordY"], "639")
        self.assertEqual(obj["userClick.region"], "QnA")
        self.assertEqual(obj["userClick.target"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.clickStep"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.questionIndex"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.answer1"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.answer2"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick"], "NA") # TODO ask Jed about this non interactive one
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

    def test_clickActionLabel(self):
        line = "tutorial.scr,9-13-2018,13:58:54:296,1536872334296,75,75.2,userClick:476_477;region:gameArea;target:actionLabel-step-75-action-AttackQ4;clickActionLabel:D2ESCAPED-COLON Attack Q4,false,false,false,false,false,false"
        extraction_map = extractionMap.get_extraction_map()
        obj = parse_line(line,extraction_map)
        self.assertEqual(obj["stepIntoDecisionPoint"], "NA")
        self.assertEqual(obj["showQuestion"], "NA")
        self.assertEqual(obj["hideEntityTooltips"], "NA")
        self.assertEqual(obj["showEntityTooltip.entityInfo"], "NA")
        self.assertEqual(obj["showEntityTooltip.tipQuadrant"], "NA")
        self.assertEqual(obj["startMouseOverSaliencyMap"], "NA")
        self.assertEqual(obj["endMouseOverSaliencyMap"], "NA")

        self.assertEqual(obj["userClick"], "yes")
        self.assertEqual(obj["userClick.coordX"], "476")
        self.assertEqual(obj["userClick.coordY"], "477")
        self.assertEqual(obj["userClick.region"], "gameArea")
        self.assertEqual(obj["userClick.target"], "actionLabel-step-75-action-AttackQ4")
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

        self.assertEqual(obj["userClick.clickActionLabel"], "D2: Attack Q4")
        self.assertEqual(obj["userClick.clickActionLabelDenied"], "NA")
        self.assertEqual(obj["userClick.selectedRewardBar"], "NA")

        self.assertEqual(obj["userClick.clickSaliencyMap"], "NA")
        self.assertEqual(obj["userClick.clickSaliencyMap.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.clickSaliencyMap.clickQuadrant"], "NA")

        self.assertEqual(obj["userClick.touchCumRewardLabel"], "NA")
        self.assertEqual(obj["userClick.touchCumRewardValueFor"], "NA")

    def test_clickActionLabelDenied(self):
        line = "tutorial.scr,9-13-2018,12:22:39:120,1536866559120,1,1.0,userClick:469_478;region:gameArea;target:actionLabel-step-75-action-AttackQ4;clickActionLabelDenied:D2ESCAPED-COLON Attack Q4,false,false,false,false,false,false"
        extraction_map = extractionMap.get_extraction_map()
        obj = parse_line(line,extraction_map)
        self.assertEqual(obj["stepIntoDecisionPoint"], "NA")
        self.assertEqual(obj["showQuestion"], "NA")
        self.assertEqual(obj["hideEntityTooltips"], "NA")
        self.assertEqual(obj["showEntityTooltip.entityInfo"], "NA")
        self.assertEqual(obj["showEntityTooltip.tipQuadrant"], "NA")
        self.assertEqual(obj["startMouseOverSaliencyMap"], "NA")
        self.assertEqual(obj["endMouseOverSaliencyMap"], "NA")

        self.assertEqual(obj["userClick"], "yes")
        self.assertEqual(obj["userClick.coordX"], "469")
        self.assertEqual(obj["userClick.coordY"], "478")
        self.assertEqual(obj["userClick.region"], "gameArea")
        self.assertEqual(obj["userClick.target"], "actionLabel-step-75-action-AttackQ4")
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
        self.assertEqual(obj["userClick.clickActionLabelDenied"], "D2: Attack Q4")
        self.assertEqual(obj["userClick.selectedRewardBar"], "NA")

        self.assertEqual(obj["userClick.clickSaliencyMap"], "NA")
        self.assertEqual(obj["userClick.clickSaliencyMap.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.clickSaliencyMap.clickQuadrant"], "NA")

        self.assertEqual(obj["userClick.touchCumRewardLabel"], "NA")
        self.assertEqual(obj["userClick.touchCumRewardValueFor"], "NA")
    
    def test_touchCumRewardLabel(self):
        line = "tutorial.scr,9-13-2018,13:48:47:455,1536871727455,1,1.0,userClick:85_80;region:gameArea;target:null;touchCumRewardLabel:total score,false,false,false,false,false,false"
        extraction_map = extractionMap.get_extraction_map()
        obj = parse_line(line,extraction_map)
        self.assertEqual(obj["stepIntoDecisionPoint"], "NA")
        self.assertEqual(obj["showQuestion"], "NA")
        self.assertEqual(obj["hideEntityTooltips"], "NA")
        self.assertEqual(obj["showEntityTooltip.entityInfo"], "NA")
        self.assertEqual(obj["showEntityTooltip.tipQuadrant"], "NA")
        self.assertEqual(obj["startMouseOverSaliencyMap"], "NA")
        self.assertEqual(obj["endMouseOverSaliencyMap"], "NA")

        self.assertEqual(obj["userClick"], "yes")
        self.assertEqual(obj["userClick.coordX"], "85")
        self.assertEqual(obj["userClick.coordY"], "80")
        self.assertEqual(obj["userClick.region"], "gameArea")
        self.assertEqual(obj["userClick.target"], "null")
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

        self.assertEqual(obj["userClick.touchCumRewardLabel"], "total score")
        self.assertEqual(obj["userClick.touchCumRewardValueFor"], "NA")
        
    def test_touchCumRewardValueFor(self):
        line = "tutorial.scr,9-13-2018,13:49:23:343,1536871763343,1,1.0,userClick:206_75;region:gameArea;target:rewardtotalscore;touchCumRewardValueFor:total score,false,false,false,false,false,false"
        extraction_map = extractionMap.get_extraction_map()
        obj = parse_line(line,extraction_map)
        self.assertEqual(obj["stepIntoDecisionPoint"], "NA")
        self.assertEqual(obj["showQuestion"], "NA")
        self.assertEqual(obj["hideEntityTooltips"], "NA")
        self.assertEqual(obj["showEntityTooltip.entityInfo"], "NA")
        self.assertEqual(obj["showEntityTooltip.tipQuadrant"], "NA")
        self.assertEqual(obj["startMouseOverSaliencyMap"], "NA")
        self.assertEqual(obj["endMouseOverSaliencyMap"], "NA")

        self.assertEqual(obj["userClick"], "yes")
        self.assertEqual(obj["userClick.coordX"], "206")
        self.assertEqual(obj["userClick.coordY"], "75")
        self.assertEqual(obj["userClick.region"], "gameArea")
        self.assertEqual(obj["userClick.target"], "rewardtotalscore")
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
        self.assertEqual(obj["userClick.touchCumRewardValueFor"], "total score") 
