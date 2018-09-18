import unittest
from flatten import parse_line
import extractionMap as extractionMap
# selectedRewardBar:            "tutorial.scr,9-13-2018,12:23:47:489,1536866627489,1,1.0,userClick:721_277;region:scaii-interface;target:rewardBar;selectedRewardBar:Attack Q1.Enemy Destroyed,false,false,false,false,false,false"
# clickSaliencyMap:             "tutorial.scr,9-13-2018,12:29:33:803,1536866973803,1,1.0,userClick:817_509;region:saliencyMap;target:saliencyMap--DP1-2_EnemyDestroyed--Size;clickSaliencyMap:Size_(NA_upperRightQuadrant),false,false,false,false,false,false"
#                               "tutorial.scr,9-13-2018,12:30:6:570,1536867006570,1,1.0,userClick:771_514;region:saliencyMap;target:saliencyMap--DP1-2_EnemyDestroyed--Size;clickSaliencyMap:Size_(friendly-Big Fort_upperLeftQuadrant),false,false,false,false,false,false"
# startMouseOverSaliencyMap:    "tutorial.scr,9-13-2018,12:23:49:897,1536866629897,1,1.0,region:saliencyMap;target:saliencyMap--DP1-2_EnemyDestroyed--Tank;startMouseOverSaliencyMap:Tank,false,false,false,false,false,false"
# endMouseOverSaliencyMap:      "tutorial.scr,9-13-2018,12:23:49:910,1536866629910,1,1.0,region:saliencyMap;target:saliencyMap--DP1-2_EnemyDestroyed--Tank;endMouseOverSaliencyMap:Tank,false,false,false,false,false,false"

class TestFlatteningExplan(unittest.TestCase):

    def test_selectedRewardBar(self):
        line = "tutorial.scr,9-13-2018,12:23:47:489,1536866627489,1,1.0,userClick:721_277;region:scaii-interface;target:rewardBar;selectedRewardBar:Attack Q1.Enemy Destroyed,false,false,false,false,false,false"
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
        self.assertEqual(obj["userClick.coordX"], "721")
        self.assertEqual(obj["userClick.coordY"], "277")
        self.assertEqual(obj["userClick.region"], "scaii-interface")
        self.assertEqual(obj["userClick.target"], "rewardBar")
        self.assertEqual(obj["userClick.answerQuestion.clickStep"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.questionId"], "NA")
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
        self.assertEqual(obj["userClick.selectedRewardBar"], "Attack Q1.Enemy Destroyed")

        self.assertEqual(obj["userClick.clickSaliencyMap"], "NA")
        self.assertEqual(obj["userClick.clickSaliencyMap.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.clickSaliencyMap.clickQuadrant"], "NA")

        self.assertEqual(obj["userClick.touchCumRewardLabel"], "NA")
        self.assertEqual(obj["userClick.touchCumRewardValueFor"], "NA")


    def test_clickSaliencyMap(self):
        line = "tutorial.scr,9-13-2018,12:30:6:570,1536867006570,1,1.0,userClick:771_514;region:saliencyMap;target:saliencyMap--DP1-2_EnemyDestroyed--Size;clickSaliencyMap:Size_(friendly-Big Fort_upperLeftQuadrant),false,false,false,false,false,false"
        #line = "tutorial.scr,9-13-2018,12:29:33:803,1536866973803,1,1.0,userClick:817_509;region:saliencyMap;target:saliencyMap--DP1-2_EnemyDestroyed--Size;clickSaliencyMap:Size_(NA_upperRightQuadrant),false,false,false,false,false,false"
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
        self.assertEqual(obj["userClick.coordX"], "771")
        self.assertEqual(obj["userClick.coordY"], "514")
        self.assertEqual(obj["userClick.region"], "saliencyMap")
        self.assertEqual(obj["userClick.target"], "saliencyMap--DP1-2_EnemyDestroyed--Size")
        self.assertEqual(obj["userClick.answerQuestion.clickStep"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.questionId"], "NA")
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

        self.assertEqual(obj["userClick.clickSaliencyMap"], "Size")
        self.assertEqual(obj["userClick.clickSaliencyMap.clickGameEntity"], "friendly-Big Fort")
        self.assertEqual(obj["userClick.clickSaliencyMap.clickQuadrant"], "upperLeftQuadrant")

        self.assertEqual(obj["userClick.touchCumRewardLabel"], "NA")
        self.assertEqual(obj["userClick.touchCumRewardValueFor"], "NA")


    def test_startMouseOverSaliencyMap(self):
        line = "tutorial.scr,9-13-2018,12:23:49:897,1536866629897,1,1.0,region:saliencyMap;target:saliencyMap--DP1-2_EnemyDestroyed--Tank;startMouseOverSaliencyMap:Tank,false,false,false,false,false,false"
        extraction_map = extractionMap.get_extraction_map()
        obj = parse_line(line,extraction_map)
        self.assertEqual(obj["stepIntoDecisionPoint"], "NA")
        self.assertEqual(obj["showQuestion"], "NA")
        self.assertEqual(obj["hideEntityTooltips"], "NA")
        self.assertEqual(obj["showEntityTooltip.entityInfo"], "NA")
        self.assertEqual(obj["showEntityTooltip.tipQuadrant"], "NA")
        self.assertEqual(obj["startMouseOverSaliencyMap"], "Tank")
        self.assertEqual(obj["endMouseOverSaliencyMap"], "NA")

        self.assertEqual(obj["userClick"], "NA")
        self.assertEqual(obj["userClick.coordX"], "NA")
        self.assertEqual(obj["userClick.coordY"], "NA")
        self.assertEqual(obj["userClick.region"], "saliencyMap")
        self.assertEqual(obj["userClick.target"], "saliencyMap--DP1-2_EnemyDestroyed--Tank")
        self.assertEqual(obj["userClick.answerQuestion.clickStep"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.questionId"], "NA")
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


    def test_endMouseOverSaliencyMap(self):
        line = "tutorial.scr,9-13-2018,12:23:49:910,1536866629910,1,1.0,region:saliencyMap;target:saliencyMap--DP1-2_EnemyDestroyed--Tank;endMouseOverSaliencyMap:Tank,false,false,false,false,false,false"
        extraction_map = extractionMap.get_extraction_map()
        obj = parse_line(line,extraction_map)
        self.assertEqual(obj["stepIntoDecisionPoint"], "NA")
        self.assertEqual(obj["showQuestion"], "NA")
        self.assertEqual(obj["hideEntityTooltips"], "NA")
        self.assertEqual(obj["showEntityTooltip.entityInfo"], "NA")
        self.assertEqual(obj["showEntityTooltip.tipQuadrant"], "NA")
        self.assertEqual(obj["startMouseOverSaliencyMap"], "NA")
        self.assertEqual(obj["endMouseOverSaliencyMap"], "Tank")

        self.assertEqual(obj["userClick"], "NA")
        self.assertEqual(obj["userClick.coordX"], "NA")
        self.assertEqual(obj["userClick.coordY"], "NA")
        self.assertEqual(obj["userClick.region"], "saliencyMap")
        self.assertEqual(obj["userClick.target"], "saliencyMap--DP1-2_EnemyDestroyed--Tank")
        self.assertEqual(obj["userClick.answerQuestion.clickStep"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.questionId"], "NA")
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
