import sys
import os
import ntpath

import unittest

import log_check
from flatten import get_blank_line_object
from flatten import replace_all_delimeters_with_commas
from flatten import get_key_for_line
from flatten import parse_line
import extractionMap as extractionMap

def path_leaf(path):
    head, tail = ntpath.split(path)
    return tail or ntpath.basename(head)

def path_before_leaf(path):
    head = ntpath.split(path)
    return head[0]

def main():
    if (len(sys.argv) != 2):
        print("No file path given. Exiting...")
        sys.exit()
    filepath = sys.argv[1]

    if not os.path.isfile(filepath):
        print("File path {} does not exist. Exiting...".format(filepath))
        sys.exit()

    error_check = log_check.start_log_check()
    if (error_check == True):
        print("Errors found. Quiting before writing...")
        sys.exit()

    file_name = path_leaf(filepath)
    file_path = path_before_leaf(filepath)

    of_name = "formatted_" + file_name
    #of_path = file_path + of_name
    of_path = os.path.join(file_path, of_name)

    if os.path.isfile(of_path):
        print("File {} already exists. Would you like to:".format(of_path))
        print("Exit (1)\nOverwrite (2)")
        user_file_choice = input()
        if (user_file_choice == '1'):
            print("Exiting...")
            sys.exit()
        elif (user_file_choice == '2'):
            print("Overwriting...")
            of = open(of_path, 'w')
        else:
            print("Invalid choice. Exiting...")
            sys.exit()
    else:
        of = open(of_path, 'w')

    of.write("fileName,date,time,1970Sec,decisionPoint,questionId,stepIntoDecisionPoint,showQuestion,hideEntityTooltips,showEntityTooltip.entityInfo,showEntityTooltip.tipQuadrant,startMouseOverSaliencyMap,endMouseOverSaliencyMap,waitForResearcherStart,waitForResearcherEnd,userClick,userClick.coordX,userClick.coordY,userClick.region,userClick.target,userClick.answerQuestion.clickStep,userClick.answerQuestion.questionId,userClick.answerQuestion.answer1,userClick.answerQuestion.answer2,userClick.answerQuestion.userClick,userClick.answerQuestion.userClick.fileName,userClick.answerQuestion.userClick.date,userClick.answerQuestion.userClick.time,userClick.answerQuestion.userClick.1970Sec,userClick.answerQuestion.userClick.decisionPoint,userClick.answerQuestion.userClick.questionId,userClick.answerQuestion.userClick.coordX,userClick.answerQuestion.userClick.coordY,userClick.answerQuestion.userClick.region,userClick.answerQuestion.userClick.target,userClick.answerQuestion.userClick.clickEntity.clickGameEntity,userClick.answerQuestion.userClick.clickEntity.clickQuadrant,userClick.answerQuestion.userClick.clickEntity.coordX,userClick.answerQuestion.userClick.clickEntity.coordY,userClick.answerQuestion.userClick.selectedRewardBar,userClick.answerQuestion.userClick.clickSaliencyMap,userClick.answerQuestion.userClick.clickSaliencyMap.clickGameEntity,userClick.answerQuestion.userClick.clickSaliencyMap.clickQuadrant,userClick.timelineClick,userClick.jumpToDecisionPoint,userClick.clickTimeLineBlocker,userClick.play,userClick.pause,userClick.touchStepProgressLabel,userClick.clickGameQuadrant,userClick.clickEntity.clickGameEntity,userClick.clickEntity.clickQuadrant,userClick.clickEntity.coordX,userClick.clickEntity.coordY,userClick.clickActionLabel,userClick.clickActionLabelDenied,userClick.selectedRewardBar,userClick.clickSaliencyMap,userClick.clickSaliencyMap.clickGameEntity,userClick.clickSaliencyMap.clickQuadrant,userClick.touchCumRewardLabel,userClick.touchCumRewardValueFor")
    of.write("\n")
    with open(filepath) as fp:
        for line in fp:
            if ("date,time,secSince1970,decisionPoint,questionId,userAction" in line or "clickHitPoints:" in line):
                print()
            else:
                print(line)
                extraction_map = extractionMap.get_extraction_map()
                obj = parse_line(line,extraction_map)
                of.write(obj["fileName"] + ',')
                of.write(obj["date"] + ',')
                of.write(obj["time"] + ',')
                of.write(obj["1970Sec"] + ',')
                of.write(obj["decisionPoint"] + ',')
                of.write(obj["questionId"] + ',')
                of.write(obj["stepIntoDecisionPoint"] + ',')
                of.write(obj["showQuestion"] + ',')
                of.write(obj["hideEntityTooltips"] + ',')
                of.write(obj["showEntityTooltip.entityInfo"] + ',')
                of.write(obj["showEntityTooltip.tipQuadrant"] + ',')
                of.write(obj["startMouseOverSaliencyMap"] + ',')
                of.write(obj["endMouseOverSaliencyMap"] + ',')
                of.write(obj["waitForResearcherStart"] + ',')
                of.write(obj["waitForResearcherEnd"] + ',')
                of.write(obj["userClick"] + ',')
                of.write(obj["userClick.coordX"] + ',')
                of.write(obj["userClick.coordY"] + ',')
                of.write(obj["userClick.region"] + ',')
                of.write(obj["userClick.target"] + ',')
                of.write(obj["userClick.answerQuestion.clickStep"] + ',')
                of.write(obj["userClick.answerQuestion.questionId"] + ',')
                of.write(obj["userClick.answerQuestion.answer1"] + ',')
                of.write(obj["userClick.answerQuestion.answer2"] + ',')
                of.write(obj["userClick.answerQuestion.userClick"] + ',')
                of.write(obj["userClick.answerQuestion.userClick.fileName"] + ',')
                of.write(obj["userClick.answerQuestion.userClick.date"] + ',')
                of.write(obj["userClick.answerQuestion.userClick.time"] + ',')
                of.write(obj["userClick.answerQuestion.userClick.1970Sec"] + ',')
                of.write(obj["userClick.answerQuestion.userClick.decisionPoint"] + ',')
                of.write(obj["userClick.answerQuestion.userClick.questionId"] + ',')
                of.write(obj["userClick.answerQuestion.userClick.coordX"] + ',')
                of.write(obj["userClick.answerQuestion.userClick.coordY"] + ',')
                of.write(obj["userClick.answerQuestion.userClick.region"] + ',')
                of.write(obj["userClick.answerQuestion.userClick.target"] + ',')
                of.write(obj["userClick.answerQuestion.userClick.clickEntity.clickGameEntity"] + ',')
                of.write(obj["userClick.answerQuestion.userClick.clickEntity.clickQuadrant"] + ',')
                of.write(obj["userClick.answerQuestion.userClick.clickEntity.coordX"] + ',')
                of.write(obj["userClick.answerQuestion.userClick.clickEntity.coordY"] + ',')
                of.write(obj["userClick.answerQuestion.userClick.selectedRewardBar"] + ',')
                of.write(obj["userClick.answerQuestion.userClick.clickSaliencyMap"] + ',')
                of.write(obj["userClick.answerQuestion.userClick.clickSaliencyMap.clickGameEntity"] + ',')
                of.write(obj["userClick.answerQuestion.userClick.clickSaliencyMap.clickQuadrant"] + ',')
                of.write(obj["userClick.timelineClick"] + ',')
                of.write(obj["userClick.jumpToDecisionPoint"] + ',')
                of.write(obj["userClick.clickTimeLineBlocker"] + ',')
                of.write(obj["userClick.play"] + ',')
                of.write(obj["userClick.pause"] + ',')
                of.write(obj["userClick.touchStepProgressLabel"] + ',')
                of.write(obj["userClick.clickGameQuadrant"] + ',')
                of.write(obj["userClick.clickEntity.clickGameEntity"] + ',')
                of.write(obj["userClick.clickEntity.clickQuadrant"] + ',')
                of.write(obj["userClick.clickEntity.coordX"] + ',')
                of.write(obj["userClick.clickEntity.coordY"] + ',')
                of.write(obj["userClick.clickActionLabel"] + ',')
                of.write(obj["userClick.clickActionLabelDenied"] + ',')
                of.write(obj["userClick.selectedRewardBar"] + ',')
                of.write(obj["userClick.clickSaliencyMap"] + ',')
                of.write(obj["userClick.clickSaliencyMap.clickGameEntity"] + ',')
                of.write(obj["userClick.clickSaliencyMap.clickQuadrant"] + ',')
                of.write(obj["userClick.touchCumRewardLabel"] + ',')
                of.write(obj["userClick.touchCumRewardValueFor"])
                of.write("\n")
    of.close()

if __name__ == '__main__':
    main()