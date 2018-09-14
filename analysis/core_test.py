import unittest

from flatten import get_blank_line_object
from flatten import replace_all_delimeters_with_commas
from flatten import get_key_for_line
from flatten import parse_line
import extractionMap as extractionMap
class TestCore(unittest.TestCase):

    '''
    fileName
    date
    time
    1970Sec
    decisionPoint
    questionId

    stepIntoDecisionPoint
    showQuestion
    hideEntityTooltips
    showEntityTooltip.entityInfo
    showEntityTooltip.tipQuadrant
    startMouseOverSaliencyMap
    endMouseOverSaliencyMap

    userClick.coordX
    userClick.coordY
    userClick.region
    userClick.target
    userClick.answerQuestion.clickStep
    userClick.answerQuestion.questionIndex
    userClick.answerQuestion.answer1
    userClick.answerQuestion.answer2

    userClick.answerQuestion.userClick
    userClick.answerQuestion.userClick.fileName
    userClick.answerQuestion.userClick.date
    userClick.answerQuestion.userClick.time
    userClick.answerQuestion.userClick.1970Sec
    userClick.answerQuestion.userClick.decisionPoint
    userClick.answerQuestion.userClick.questionId
    userClick.answerQuestion.userClick.coordX
    userClick.answerQuestion.userClick.coordY
    userClick.answerQuestion.userClick.region
    userClick.answerQuestion.userClick.target

    userClick.answerQuestion.userClick.clickEntity.clickGameEntity
    userClick.answerQuestion.userClick.clickEntity.clickQuadrant
    userClick.answerQuestion.userClick.clickEntity.coordX
    userClick.answerQuestion.userClick.clickEntity.coordY

    userClick.answerQuestion.userClick.selectedRewardBar

    userClick.answerQuestion.userClick.clickSaliencyMap
    userClick.answerQuestion.userClick.clickSaliencyMap.clickGameEntity
    userClick.answerQuestion.userClick.clickSaliencyMap.clickQuadrant

    userClick.timelineClick
    userClick.jumpToDecisionPoint
    userClick.clickTimeLineBlocker
    userClick.rewind
    userClick.play
    userClick.pause
    userClick.touchStepProgressLabel
    userClick.clickGameQuadrant

    userClick.clickEntity.clickGameEntity
    userClick.clickEntity.clickQuadrant
    userClick.clickEntity.coordX
    userClick.clickEntity.coordY

    userClick.clickActionLabel
    userClick.clickActionLabelDenied
    userClick.selectedRewardBar

    userClick.clickSaliencyMap
    userClick.clickSaliencyMap.clickGameEntity
    userClick.clickSaliencyMap.clickQuadrant

    userClick.touchCumRewardLabel
    userClick.touchCumRewardValueFor
    '''
    def test_comma_replace(self):
        #removed the ) because there is no instance where a field is followed by it so: ")," would turn into ,, or ,
        #                                                                                                          ^ if that ',' is before the ',false,false,false,false,false,false'
        #                                                                                                          at end of line will create extra unneeded field
        self.assertEqual(replace_all_delimeters_with_commas(",x_x(x,x:x;x"), ",x,x,x,x,x,x")

    def test_get_key_for_line(self):
        self.assertEqual("stepIntoDecisionPoint",get_key_for_line("tutorial.scr,9-13-2018,12:9:0:335,1536865740335,undefined,undefined,stepIntoDecisionPoint:1,false,false,false,false,false,false"))
        self.assertEqual("showQuestion",get_key_for_line("tutorial.scr,9-13-2018,13:53:41:122,1536872021122,1,1.1,showQuestion:1.2,false,false,false,false,false,false"))
        self.assertEqual("hideEntityTooltips",get_key_for_line("tutorial.scr,9-13-2018,12:15:3:802,1536866103802,1,1.0,hideEntityTooltips:all,false,false,false,false,false,false"))
        self.assertEqual("showEntityTooltip",get_key_for_line("tutorial.scr,9-13-2018,12:15:4:83,1536866104083,1,1.0,showEntityTooltip:friendly-City_lowerLeftQuadrant,false,false,false,false,false,false"))
        self.assertEqual("userClick",get_key_for_line("tutorial.scr,9-13-2018,12:16:12:890,1536866172890,1,1.0,userClick:297_639;region:QnA;NA;NA,false,false,false,false,false,false"))
        self.assertEqual("answerQuestion.userClick.NA",get_key_for_line("tutorial.scr,9-13-2018,13:56:6:505,1536872166505,75,75.2,userClick:317_654;region:QnA;target:button-save;answerQuestion:75.2_\"asdf\"_NA_(NA),false,false,false,false,false,false"))
        self.assertEqual("answerQuestion.userClick.clickEntity",get_key_for_line("tutorial.scr,9-13-2018,13:54:7:873,1536872047873,1,1.2,userClick:299_688;region:QnA;target:button-save;answerQuestion:1.2_\"Goodbye\"_NA_(tutorial.scr,9-13-2018,13:54:3:26,1536872043026,1,1.2,userClick:391_152;region:gameArea;target:gameboard;clickEntity:friendly-Big Fort_upperLeftQuadrant_76_90,false,false,false,false,false,false),false,false,false,false,false,false"))
        self.assertEqual("answerQuestion.userClick.selectedRewardBar",get_key_for_line("tutorial.scr,9-13-2018,13:53:41:130,1536872021130,1,1.2,userClick:290_693;region:QnA;target:button-save;answerQuestion:1.1_\"Hello Debugger\"_NA_(tutorial.scr,9-13-2018,13:53:35:594,1536872015594,1,1.1,userClick:751_330;region:scaii-interface;target:rewardBar;selectedRewardBar:Attack Q1.Friend Destroyed,false,false,false,false,false,false),false,false,false,false,false,false"))
        self.assertEqual("answerQuestion.userClick.clickSaliencyMap",get_key_for_line("tutorial.scr,9-13-2018,13:52:25:581,1536871945581,1,1.1,userClick:310_700;region:QnA;target:button-save;answerQuestion:1.0_\"asdf\"_NA_(tutorial.scr,9-13-2018,12:30:6:570,1536867006570,1,1.0,userClick:771_514;region:saliencyMap;target:saliencyMap--DP1-2_EnemyDestroyed--Size;clickSaliencyMap:Size_(friendly-Big Fort_upperLeftQuadrant),false,false,false,false,false,false),false,false,false,false,false,false"))
        self.assertEqual("timelineClick",get_key_for_line("tutorial.scr,9-13-2018,13:59:37:648,1536872377648,75,75.2,userClick:328_401;region:gameArea;target:expl-control-canvas;timelineClick:106,false,false,false,false,false,false"))
        self.assertEqual("jumpToDecisionPoint",get_key_for_line("tutorial.scr,9-13-2018,16:29:14:251,1536881354251,75,75.2,userClick:245_406;region:gameArea;target:decisionPointList;jumpToDecisionPoint:75,false,false,false,false,false,false"))
        self.assertEqual("clickTimeLineBlocker",get_key_for_line("tutorial.scr,9-13-2018,13:55:13:920,1536872113920,1,1.2,userClick:301_422;region:gameArea;target:right-block-div;clickTimeLineBlocker:NA,false,false,false,false,false,false"))
        self.assertEqual("play",get_key_for_line("tutorial.scr,9-13-2018,13:46:10:103,1536871570103,1,1.0,userClick:486_337;region:gameArea;target:pauseResumeButton;play:NA,false,false,false,false,false,false"))
        self.assertEqual("pause",get_key_for_line("tutorial.scr,9-13-2018,13:46:11:665,1536871571665,1,1.0,userClick:481_341;region:gameArea;target:pauseResumeButton;pause:NA,false,false,false,false,false,false"))
        self.assertEqual("touchStepProgressLabel",get_key_for_line("tutorial.scr,9-13-2018,13:57:30:581,1536872250581,75,75.2,userClick:70_337;region:gameArea;target:step-value;touchStepProgressLabel:NA,false,false,false,false,false,false"))
        self.assertEqual("clickGameQuadrant",get_key_for_line("tutorial.scr,9-13-2018,13:48:5:219,1536871685219,1,1.0,userClick:473_106;region:gameArea;target:gameboardBackground;clickGameQuadrant:upperRightQuadrant,false,false,false,false,false,false"))
        self.assertEqual("clickEntity",get_key_for_line("tutorial.scr,9-13-2018,12:20:54:902,1536866454902,1,1.0,userClick:515_260;region:gameArea;target:gameboard;clickEntity:friendly-Big Fort_lowerRightQuadrant_200_198,false,false,false,false,false,false"))
        self.assertEqual("clickActionLabel",get_key_for_line("tutorial.scr,9-13-2018,13:58:54:296,1536872334296,75,75.2,userClick:476_477;region:gameArea;target:actionLabel-step-75-action-AttackQ4;clickActionLabel:D2ESCAPED-COLON Attack Q4,false,false,false,false,false,false"))
        self.assertEqual("clickActionLabelDenied",get_key_for_line("tutorial.scr,9-13-2018,12:22:39:120,1536866559120,1,1.0,userClick:469_478;region:gameArea;target:actionLabel-step-75-action-AttackQ4;clickActionLabelDenied:D2ESCAPED-COLON Attack Q4,false,false,false,false,false,false"))
        self.assertEqual("selectedRewardBar",get_key_for_line("tutorial.scr,9-13-2018,12:23:47:489,1536866627489,1,1.0,userClick:721_277;region:scaii-interface;target:rewardBar;selectedRewardBar:Attack Q1.Enemy Destroyed,false,false,false,false,false,false"))
        self.assertEqual("clickSaliencyMap",get_key_for_line("tutorial.scr,9-13-2018,12:29:33:803,1536866973803,1,1.0,userClick:817_509;region:saliencyMap;target:saliencyMap--DP1-2_EnemyDestroyed--Size;clickSaliencyMap:Size_(NA_upperRightQuadrant),false,false,false,false,false,false"))
        self.assertEqual("clickSaliencyMap",get_key_for_line("tutorial.scr,9-13-2018,12:30:6:570,1536867006570,1,1.0,userClick:771_514;region:saliencyMap;target:saliencyMap--DP1-2_EnemyDestroyed--Size;clickSaliencyMap:Size_(friendly-Big Fort_upperLeftQuadrant),false,false,false,false,false,false"))
        self.assertEqual("startMouseOverSaliencyMap",get_key_for_line("tutorial.scr,9-13-2018,12:23:49:897,1536866629897,1,1.0,region:saliencyMap;target:saliencyMap--DP1-2_EnemyDestroyed--Tank;startMouseOverSaliencyMap:Tank,false,false,false,false,false,false"))
        self.assertEqual("endMouseOverSaliencyMap",get_key_for_line("tutorial.scr,9-13-2018,12:23:49:910,1536866629910,1,1.0,region:saliencyMap;target:saliencyMap--DP1-2_EnemyDestroyed--Tank;endMouseOverSaliencyMap:Tank,false,false,false,false,false,false"))
        self.assertEqual("touchCumRewardLabel",get_key_for_line( "tutorial.scr,9-13-2018,13:48:47:455,1536871727455,1,1.0,userClick:85_80;region:gameArea;target:null;touchCumRewardLabel:total score,false,false,false,false,false,false"))
        self.assertEqual("touchCumRewardValueFor",get_key_for_line("tutorial.scr,9-13-2018,13:49:23:343,1536871763343,1,1.0,userClick:206_75;region:gameArea;target:rewardtotalscore;touchCumRewardValueFor:total score,false,false,false,false,false,false"))
 

    def test_blank_line_obj(self):
        obj = get_blank_line_object()
        self.assertEqual(obj["userClick.play"], "NA")

    def test_constant_fields(self):
        line = "tutorial.scr,9-13-2018,12:15:4:83,1536866104083,1,1.0,showEntityTooltip:friendly-City_lowerLeftQuadrant,false,false,false,false,false,false"
        extraction_map = extractionMap.get_extraction_map()
        obj = parse_line(line, extraction_map)
        self.assertEqual(obj["fileName"], "tutorial.scr")
        self.assertEqual(obj["date"], "9-13-2018")
        self.assertEqual(obj["time"], "12:15:4:83")
        self.assertEqual(obj["1970Sec"], "1536866104083")
        self.assertEqual(obj["decisionPoint"], "1")
        self.assertEqual(obj["questionId"], "1.0")
