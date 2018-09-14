# showQuestion:                               "tutorial.scr,9-13-2018,13:53:41:122,1536872021122,1,1.1,showQuestion:1.2,false,false,false,false,false,false"
# answerQuestion.userClick.NA:                "tutorial.scr,9-13-2018,13:56:6:505,1536872166505,75,75.2,userClick:317_654;region:QnA;target:button-save;answerQuestion:75.2_\"asdf\"_NA_(NA),false,false,false,false,false,false"
# answerQuestion.userClick.clickEntity:       "tutorial.scr,9-13-2018,13:54:7:873,1536872047873,1,1.2,userClick:299_688;region:QnA;target:button-save;answerQuestion:1.2_\"Goodbye\"_NA_(tutorial.scr,9-13-2018,13:54:3:26,1536872043026,1,1.2,userClick:391_152;region:gameArea;target:gameboard;clickEntity:friendly-Big Fort_upperLeftQuadrant_76_90,false,false,false,false,false,false),false,false,false,false,false,false"
# answerQuestion.userClick.selectedRewardBar: "tutorial.scr,9-13-2018,13:53:41:130,1536872021130,1,1.2,userClick:290_693;region:QnA;target:button-save;answerQuestion:1.1_\"Hello Debugger\"_NA_(tutorial.scr,9-13-2018,13:53:35:594,1536872015594,1,1.1,userClick:751_330;region:scaii-interface;target:rewardBar;selectedRewardBar:Attack Q1.Friend Destroyed,false,false,false,false,false,false),false,false,false,false,false,false"
# answerQuestion.userClick.clickSaliencyMap:  "tutorial.scr,9-13-2018,13:52:25:581,1536871945581,1,1.1,userClick:310_700;region:QnA;target:button-save;answerQuestion:1.0_\"asdf\"_NA_(tutorial.scr,9-13-2018,12:30:6:570,1536867006570,1,1.0,userClick:771_514;region:saliencyMap;target:saliencyMap--DP1-2_EnemyDestroyed--Size;clickSaliencyMap:Size_(friendly-Big Fort_upperLeftQuadrant),false,false,false,false,false,false),false,false,false,false,false,false"

class test_flattening_qa(unittest.TestCase):


    def test_showQuestion(self):
        line = "tutorial.scr,9-13-2018,13:53:41:122,1536872021122,1,1.1,showQuestion:1.2,false,false,false,false,false,false"
        obj = flatten.parse_line(line)
        self.assertEqual(obj["stepIntoDecisionPoint"], "NA")
        self.assertEqual(obj["showQuestion"], "1.2")
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


    def test_answerQuestion_userClick_NA(self):
        line = "tutorial.scr,9-13-2018,13:56:6:505,1536872166505,75,75.2,userClick:317_654;region:QnA;target:button-save;answerQuestion:75.2_\"asdf\"_NA_(NA),false,false,false,false,false,false"
        obj = flatten.parse_line(line)
        self.assertEqual(obj["stepIntoDecisionPoint"], "NA")
        self.assertEqual(obj["showQuestion"], "NA")
        self.assertEqual(obj["hideEntityTooltips"], "NA")
        self.assertEqual(obj["showEntityTooltip.entityInfo"], "NA")
        self.assertEqual(obj["showEntityTooltip.tipQuadrant"], "NA")
        self.assertEqual(obj["startMouseOverSaliencyMap"], "NA")
        self.assertEqual(obj["endMouseOverSaliencyMap"], "NA")

        self.assertEqual(obj["userClick.coordX"], "317")
        self.assertEqual(obj["userClick.coordY"], "654")
        self.assertEqual(obj["userClick.region"], "QnA")
        self.assertEqual(obj["userClick.target"], "button-save")
        self.assertEqual(obj["userClick.answerQuestion.clickStep"], "75")
        self.assertEqual(obj["userClick.answerQuestion.questionIndex"], "2")
        self.assertEqual(obj["userClick.answerQuestion.answer1"], "\"asdf\"")
        self.assertEqual(obj["userClick.answerQuestion.answer2"], "NA") # TODO: ask jed if leave as NA or yes

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


    def test_answerQuestion_userClick_clickEntity(self):
        line = "tutorial.scr,9-13-2018,13:54:7:873,1536872047873,1,1.2,userClick:299_688;region:QnA;target:button-save;answerQuestion:1.2_\"Goodbye\"_NA_(tutorial.scr,9-13-2018,13:54:3:26,1536872043026,1,1.2,userClick:391_152;region:gameArea;target:gameboard;clickEntity:friendly-Big Fort_upperLeftQuadrant_76_90,false,false,false,false,false,false),false,false,false,false,false,false"
        obj = flatten.parse_line(line)
        self.assertEqual(obj["stepIntoDecisionPoint"], "NA")
        self.assertEqual(obj["showQuestion"], "NA")
        self.assertEqual(obj["hideEntityTooltips"], "NA")
        self.assertEqual(obj["showEntityTooltip.entityInfo"], "NA")
        self.assertEqual(obj["showEntityTooltip.tipQuadrant"], "NA")
        self.assertEqual(obj["startMouseOverSaliencyMap"], "NA")
        self.assertEqual(obj["endMouseOverSaliencyMap"], "NA")

        self.assertEqual(obj["userClick.coordX"], "299")
        self.assertEqual(obj["userClick.coordY"], "688")
        self.assertEqual(obj["userClick.region"], "QnA")
        self.assertEqual(obj["userClick.target"], "button-save")
        self.assertEqual(obj["userClick.answerQuestion.clickStep"], "1")
        self.assertEqual(obj["userClick.answerQuestion.questionIndex"], "2")
        self.assertEqual(obj["userClick.answerQuestion.answer1"], "\"Goodbye\"")
        self.assertEqual(obj["userClick.answerQuestion.answer2"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.fileName"], "tutorial.scr")
        self.assertEqual(obj["userClick.answerQuestion.userClick.date"], "9-13-2018")
        self.assertEqual(obj["userClick.answerQuestion.userClick.time"], "13:54:3:26")
        self.assertEqual(obj["userClick.answerQuestion.userClick.1970Sec"], "1536872043026")
        self.assertEqual(obj["userClick.answerQuestion.userClick.decisionPoint"], "1")
        self.assertEqual(obj["userClick.answerQuestion.userClick.questionId"], "1.2")
        self.assertEqual(obj["userClick.answerQuestion.userClick.coordX"], "391")
        self.assertEqual(obj["userClick.answerQuestion.userClick.coordY"], "152")
        self.assertEqual(obj["userClick.answerQuestion.userClick.region"], "gameArea")
        self.assertEqual(obj["userClick.answerQuestion.userClick.target"], "gameboard")

        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.clickGameEntity"], "friendly-Big Fort")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.clickQuadrant"], "upperLeftQuadrant")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.coordX"], "76")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.coordY"], "90")

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


    def test_answerQuestion_userClick_selectedRewardBar(self):
        line = "tutorial.scr,9-13-2018,13:53:41:130,1536872021130,1,1.2,userClick:290_693;region:QnA;target:button-save;answerQuestion:1.1_\"Hello Debugger\"_NA_(tutorial.scr,9-13-2018,13:53:35:594,1536872015594,1,1.1,userClick:751_330;region:scaii-interface;target:rewardBar;selectedRewardBar:Attack Q1.Friend Destroyed,false,false,false,false,false,false),false,false,false,false,false,false"
        obj = flatten.parse_line(line)
        self.assertEqual(obj["stepIntoDecisionPoint"], "NA")
        self.assertEqual(obj["showQuestion"], "NA")
        self.assertEqual(obj["hideEntityTooltips"], "NA")
        self.assertEqual(obj["showEntityTooltip.entityInfo"], "NA")
        self.assertEqual(obj["showEntityTooltip.tipQuadrant"], "NA")
        self.assertEqual(obj["startMouseOverSaliencyMap"], "NA")
        self.assertEqual(obj["endMouseOverSaliencyMap"], "NA")

        self.assertEqual(obj["userClick.coordX"], "290")
        self.assertEqual(obj["userClick.coordY"], "693")
        self.assertEqual(obj["userClick.region"], "QnA")
        self.assertEqual(obj["userClick.target"], "button-save")
        self.assertEqual(obj["userClick.answerQuestion.clickStep"], "1")
        self.assertEqual(obj["userClick.answerQuestion.questionIndex"], "1")
        self.assertEqual(obj["userClick.answerQuestion.answer1"], "\"Hello Debugger\"")
        self.assertEqual(obj["userClick.answerQuestion.answer2"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.fileName"], "tutorial.scr")
        self.assertEqual(obj["userClick.answerQuestion.userClick.date"], "9-13-2018")
        self.assertEqual(obj["userClick.answerQuestion.userClick.time"], "13:53:35:594")
        self.assertEqual(obj["userClick.answerQuestion.userClick.1970Sec"], "1536872015594")
        self.assertEqual(obj["userClick.answerQuestion.userClick.decisionPoint"], "1")
        self.assertEqual(obj["userClick.answerQuestion.userClick.questionId"], "1.1")
        self.assertEqual(obj["userClick.answerQuestion.userClick.coordX"], "751")
        self.assertEqual(obj["userClick.answerQuestion.userClick.coordY"], "330")
        self.assertEqual(obj["userClick.answerQuestion.userClick.region"], "scaii-interface")
        self.assertEqual(obj["userClick.answerQuestion.userClick.target"], "rewardBar")

        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.clickQuadrant"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.coordX"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.coordY"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick.selectedRewardBar"], "Attack Q1.Friend Destroyed")

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


    def test_answerQuestion_userClick_clickSaliencyMap(self):
        line = "tutorial.scr,9-13-2018,13:52:25:581,1536871945581,1,1.1,userClick:310_700;region:QnA;target:button-save;answerQuestion:1.0_\"asdf\"_NA_(tutorial.scr,9-13-2018,12:30:6:570,1536867006570,1,1.0,userClick:771_514;region:saliencyMap;target:saliencyMap--DP1-2_EnemyDestroyed--Size;clickSaliencyMap:Size_(friendly-Big Fort_upperLeftQuadrant),false,false,false,false,false,false),false,false,false,false,false,false"
        obj = flatten.parse_line(line)
        self.assertEqual(obj["stepIntoDecisionPoint"], "NA")
        self.assertEqual(obj["showQuestion"], "NA")
        self.assertEqual(obj["hideEntityTooltips"], "NA")
        self.assertEqual(obj["showEntityTooltip.entityInfo"], "NA")
        self.assertEqual(obj["showEntityTooltip.tipQuadrant"], "NA")
        self.assertEqual(obj["startMouseOverSaliencyMap"], "NA")
        self.assertEqual(obj["endMouseOverSaliencyMap"], "NA")

        self.assertEqual(obj["userClick.coordX"], "310")
        self.assertEqual(obj["userClick.coordY"], "700")
        self.assertEqual(obj["userClick.region"], "QnA")
        self.assertEqual(obj["userClick.target"], "button-save")
        self.assertEqual(obj["userClick.answerQuestion.clickStep"], "1")
        self.assertEqual(obj["userClick.answerQuestion.questionIndex"], "0")
        self.assertEqual(obj["userClick.answerQuestion.answer1"], "\"asdf\"")
        self.assertEqual(obj["userClick.answerQuestion.answer2"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.fileName"], "tutorial.scr")
        self.assertEqual(obj["userClick.answerQuestion.userClick.date"], "9-13-2018")
        self.assertEqual(obj["userClick.answerQuestion.userClick.time"], "12:30:6:570")
        self.assertEqual(obj["userClick.answerQuestion.userClick.1970Sec"], "1536867006570")
        self.assertEqual(obj["userClick.answerQuestion.userClick.decisionPoint"], "1")
        self.assertEqual(obj["userClick.answerQuestion.userClick.questionId"], "1.0")
        self.assertEqual(obj["userClick.answerQuestion.userClick.coordX"], "771")
        self.assertEqual(obj["userClick.answerQuestion.userClick.coordY"], "514")
        self.assertEqual(obj["userClick.answerQuestion.userClick.region"], "saliencyMap")
        self.assertEqual(obj["userClick.answerQuestion.userClick.target"], "saliencyMap--DP1-2_EnemyDestroyed--Size")

        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.clickGameEntity"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.clickQuadrant"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.coordX"], "NA")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickEntity.coordY"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick.selectedRewardBar"], "NA")

        self.assertEqual(obj["userClick.answerQuestion.userClick.clickSaliencyMap"], "Size")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickSaliencyMap.clickGameEntity"], "friendly-Big Fort")
        self.assertEqual(obj["userClick.answerQuestion.userClick.clickSaliencyMap.clickQuadrant"], "upperLeftQuadrant")

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