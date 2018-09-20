import unittest
from flatten import parse_line
import extractionMap as extractionMap

# clickGameQuadrant:                          "tutorial.scr,9-13-2018,13:48:5:219,1536871685219,1,1.0,userClick:473_106;region:gameArea;target:gameboardBackground;clickGameQuadrant:upperRightQuadrant,false,false,false,false,false,false"
# clickEntity:                                "tutorial.scr,9-13-2018,12:20:54:902,1536866454902,1,1.0,userClick:515_260;region:gameArea;target:gameboard;clickEntity:friendly-Big Fort_lowerRightQuadrant_200_198,false,false,false,false,false,false"
# hideEntityTooltips:                         "tutorial.scr,9-13-2018,12:15:3:802,1536866103802,1,1.0,hideEntityTooltips:all,false,false,false,false,false,false"
# showEntityTooltip:                          "tutorial.scr,9-13-2018,12:15:4:83,1536866104083,1,1.0,showEntityTooltip:friendly-City_lowerLeftQuadrant,false,false,false,false,false,false"

class TestFlatteningGameboard(unittest.TestCase):
    def test_clickGameQuadrant(self):
        line = "tutorial.scr,9-13-2018,13:48:5:219,1536871685219,1,1.0,userClick:473_106;region:gameArea;target:gameboardBackground;clickGameQuadrant:upperRightQuadrant,false,false,false,false,false,false"
        extraction_map = extractionMap.get_extraction_map()
        obj = parse_line(line,extraction_map)
        self.assertEqual(obj["stepIntoDecisionPoint"], "NA")
        self.assertEqual(obj["showQuestion"], "NA")
        self.assertEqual(obj["hideEntityTooltips"], "NA")
        self.assertEqual(obj["showEntityTooltip.entityInfo"], "NA")
        self.assertEqual(obj["showEntityTooltip.tipQuadrant"], "NA")
        self.assertEqual(obj["startMouseOverSaliencyMap"], "NA")
        self.assertEqual(obj["endMouseOverSaliencyMap"], "NA")
        self.assertEqual(obj["waitForResearcherStart"], "NA")
        self.assertEqual(obj["waitForResearcherEnd"], "NA")

        self.assertEqual(obj["userClick"], "yes")
        self.assertEqual(obj["userClick.coordX"], "473")
        self.assertEqual(obj["userClick.coordY"], "106")
        self.assertEqual(obj["userClick.region"], "gameArea")
        self.assertEqual(obj["userClick.target"], "gameboardBackground")
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
        self.assertEqual(obj["userClick.clickGameQuadrant"], "upperRightQuadrant")

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

    def test_clickEntity(self):
        
        # "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.clickEntity.clickGameEntity,userClick.clickEntity.clickQuadrant,userClick.clickEntity.coordX,userClick.clickEntity.coordY"
        line = "tutorial.scr,9-13-2018,12:20:54:902,1536866454902,1,1.0,userClick:515_260;region:gameArea;target:gameboard;clickEntity:friendly-Big Fort_lowerRightQuadrant_200_198,false,false,false,false,false,false"
        extraction_map = extractionMap.get_extraction_map()
        obj = parse_line(line,extraction_map)
        self.assertEqual(obj["stepIntoDecisionPoint"], "NA")
        self.assertEqual(obj["showQuestion"], "NA")
        self.assertEqual(obj["hideEntityTooltips"], "NA")
        self.assertEqual(obj["showEntityTooltip.entityInfo"], "NA")
        self.assertEqual(obj["showEntityTooltip.tipQuadrant"], "NA")
        self.assertEqual(obj["startMouseOverSaliencyMap"], "NA")
        self.assertEqual(obj["endMouseOverSaliencyMap"], "NA")
        self.assertEqual(obj["waitForResearcherStart"], "NA")
        self.assertEqual(obj["waitForResearcherEnd"], "NA")

        self.assertEqual(obj["userClick"], "yes")
        self.assertEqual(obj["userClick.coordX"], "515")
        self.assertEqual(obj["userClick.coordY"], "260")
        self.assertEqual(obj["userClick.region"], "gameArea")
        self.assertEqual(obj["userClick.target"], "gameboard")
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

        self.assertEqual(obj["userClick.clickEntity.clickGameEntity"], "friendly-Big Fort")
        self.assertEqual(obj["userClick.clickEntity.clickQuadrant"], "lowerRightQuadrant")
        self.assertEqual(obj["userClick.clickEntity.coordX"], "200")
        self.assertEqual(obj["userClick.clickEntity.coordY"], "198")

        self.assertEqual(obj["userClick.clickActionLabel"], "NA")
        self.assertEqual(obj["userClick.clickActionLabelDenied"], "NA")
        self.assertEqual(obj["userClick.selectedRewardBar"], "NA")

        self.assertEqual(obj["userClick.clickSaliencyMap"], "NA")
        self.assertEqual(obj["userClick.clickSaliencyMap.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.clickSaliencyMap.clickQuadrant"], "NA")

        self.assertEqual(obj["userClick.touchCumRewardLabel"], "NA")
        self.assertEqual(obj["userClick.touchCumRewardValueFor"], "NA")

    def test_hideEntityTooltips(self):
        line = "tutorial.scr,9-13-2018,12:15:3:802,1536866103802,1,1.0,hideEntityTooltips:all,false,false,false,false,false,false"
        extraction_map = extractionMap.get_extraction_map()
        obj = parse_line(line, extraction_map)
        self.assertEqual(obj["stepIntoDecisionPoint"], "NA")
        self.assertEqual(obj["showQuestion"], "NA")
        self.assertEqual(obj["hideEntityTooltips"], "all")
        self.assertEqual(obj["showEntityTooltip.entityInfo"], "NA")
        self.assertEqual(obj["showEntityTooltip.tipQuadrant"], "NA")
        self.assertEqual(obj["startMouseOverSaliencyMap"], "NA")
        self.assertEqual(obj["endMouseOverSaliencyMap"], "NA")
        self.assertEqual(obj["waitForResearcherStart"], "NA")
        self.assertEqual(obj["waitForResearcherEnd"], "NA")

        self.assertEqual(obj["userClick"], "NA")
        self.assertEqual(obj["userClick.coordX"], "NA")
        self.assertEqual(obj["userClick.coordY"], "NA")
        self.assertEqual(obj["userClick.region"], "NA")
        self.assertEqual(obj["userClick.target"], "NA")
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

    def test_showEntityTooltip(self):
        line = "tutorial.scr,9-13-2018,12:15:4:83,1536866104083,1,1.0,showEntityTooltip:friendly-City_lowerLeftQuadrant,false,false,false,false,false,false"
        extraction_map = extractionMap.get_extraction_map()
        obj = parse_line(line, extraction_map)
        self.assertEqual(obj["stepIntoDecisionPoint"], "NA")
        self.assertEqual(obj["showQuestion"], "NA")
        self.assertEqual(obj["hideEntityTooltips"], "NA")
        self.assertEqual(obj["showEntityTooltip.entityInfo"], "friendly-City")
        self.assertEqual(obj["showEntityTooltip.tipQuadrant"], "lowerLeftQuadrant")
        self.assertEqual(obj["startMouseOverSaliencyMap"], "NA")
        self.assertEqual(obj["endMouseOverSaliencyMap"], "NA")
        self.assertEqual(obj["waitForResearcherStart"], "NA")
        self.assertEqual(obj["waitForResearcherEnd"], "NA")

        self.assertEqual(obj["userClick"], "NA")
        self.assertEqual(obj["userClick.coordX"], "NA")
        self.assertEqual(obj["userClick.coordY"], "NA")
        self.assertEqual(obj["userClick.region"], "NA")
        self.assertEqual(obj["userClick.target"], "NA")
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