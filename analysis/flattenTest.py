import unittest
from core_test import TestCore
from gameboard_test import TestFlatteningGameboard
from explan_test import TestFlatteningExplan
#import flatten as flatten
import gameboard_test as gameboard_test

def suite():
    suite = unittest.TestSuite()
    suite.addTest(TestCore('test_comma_replace'))
    suite.addTest(TestCore('test_get_key_for_line'))
    suite.addTest(TestCore('test_blank_line_obj'))
    suite.addTest(TestCore('test_constant_fields'))
    suite.addTest(TestFlatteningGameboard('test_clickGameQuadrant'))
    suite.addTest(TestFlatteningGameboard('test_clickEntity'))
    suite.addTest(TestFlatteningGameboard('test_hideEntityTooltips'))
    suite.addTest(TestFlatteningGameboard('test_showEntityTooltip'))
    suite.addTest(TestFlatteningExplan('test_selectedRewardBar'))
    suite.addTest(TestFlatteningExplan('test_clickSaliencyMap'))
    suite.addTest(TestFlatteningExplan('test_startMouseOverSaliencyMap'))
    suite.addTest(TestFlatteningExplan('test_endMouseOverSaliencyMap'))
    return suite
    

if __name__ == '__main__':
    unittest.main()