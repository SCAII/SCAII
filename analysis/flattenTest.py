import unittest
#from flatten import get_blank_line_object
import flatten as flatten

class TestFlattenings(unittest.TestCase):

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
    userClick.clickEntity.clickCoordX
    userClick.clickEntity.clickCoordY

    userClick.clickActionLabel
    userClick.clickActionLabelDenied
    userClick.selectedRewardBar

    userClick.clickSaliencyMap
    userClick.clickSaliencyMap.clickGameEntity
    userClick.clickSaliencyMap.clickQuadrant

    userClick.touchCumRewardLabel
    userClick.touchCumRewardValueFor
    '''
    def test_blank_line_obj(self):
        obj = flatten.get_blank_line_object()
        self.assertEqual(obj["userClick.play"], "NA")

    def test_constant_fields(self):
        line = "tutorial.scr,9-13-2018,12:15:4:83,1536866104083,1,1.0,showEntityTooltip:friendly-City_lowerLeftQuadrant,false,false,false,false,false,false"
        obj = flatten.parse_line(line)
        self.assertEqual(obj["fileName"], "tutorial.scr")
        self.assertEqual(obj["date"], "9-13-2018")
        self.assertEqual(obj["time"], "12:15:4:83")
        self.assertEqual(obj["1970Sec"], "1536866104083")
        self.assertEqual(obj["decisionPoint"], "1")
        self.assertEqual(obj["questionId"], "1.0")

    def test_upper(self):
        self.assertEqual('foo'.upper(), 'FOO')

    def test_isupper(self):
        self.assertTrue('FOO'.isupper())
        self.assertFalse('Foo'.isupper())

    def test_split(self):
        s = 'hello world'
        self.assertEqual(s.split(), ['hello', 'world'])
        # check that s.split fails when the separator is not a string
        with self.assertRaises(TypeError):
            s.split(2)

if __name__ == '__main__':
    unittest.main()