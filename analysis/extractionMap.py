def get_extraction_map(): 
    extractionMap = {}
    extractionMap["stepIntoDecisionPoint"] =  "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,stepIntoDecisionPoint"
    extractionMap["showQuestion"] =           "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,showQuestion"
    extractionMap["hideEntityTooltips"] =     "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,hideEntityTooltips"
    extractionMap["showEntityTooltip"] =      "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,showEntityTooltip.entityInfo,showEntityTooltip.tipQuadrant"

    extractionMap["userClick"] =              "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,userClick.target,userClick.targetDetail" #both targets are NA

    extractionMap["answerQuestion.userClick.NA"] = ("fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,"
                                            "userClick.region,OMIT,userClick.target,OMIT,userClick.answerQuestion.clickStep,"
                                            "userClick.answerQuestion.questionIndex,userClick.answerQuestion.answer1,"
                                            "userClick.answerQuestion.answer2,"
                                            "userClick.answerQuestion.userClick") # this is for when answerQuestion for click is NA
    #For click on gamemap
    extractionMap["answerQuestion.userClick.clickEntity"] =  ("fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,"
                                            "userClick.region,OMIT,userClick.target,OMIT,userClick.answerQuestion.clickStep,"
                                            "userClick.answerQuestion.questionIndex,userClick.answerQuestion.answer1,"
                                            "userClick.answerQuestion.answer2,"
                                                "userClick.answerQuestion.userClick.fileName,userClick.answerQuestion.userClick.date,"
                                                "userClick.answerQuestion.userClick.time,userClick.answerQuestion.userClick.1970Sec,"
                                                "userClick.answerQuestion.userClick.decisionPoint,userClick.answerQuestion.userClick.questionId,"
                                                "OMIT,userClick.answerQuestion.userClick.coordX,userClick.answerQuestion.userClick.coordY,"
                                                "OMIT,userClick.answerQuestion.userClick.region,OMIT,userClick.answerQuestion.userClick.target,"
                                                "OMIT,userClick.answerQuestion.userClick.clickEntity.clickGameEntity,"
                                                "userClick.answerQuestion.userClick.clickEntity.clickQuadrant,"
                                                "userClick.answerQuestion.userClick.clickEntity.coordX,"
                                                "userClick.answerQuestion.userClick.clickEntity.coordY")
    #For click on rewardBar
    extractionMap["answerQuestion.userClick.selectedRewardBar"] = ("fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,"
                                            "userClick.region,OMIT,userClick.target,OMIT,userClick.answerQuestion.clickStep,"
                                            "userClick.answerQuestion.questionIndex,userClick.answerQuestion.answer1,"
                                            "userClick.answerQuestion.answer2,"
                                                "userClick.answerQuestion.userClick.fileName,userClick.answerQuestion.userClick.date,"
                                                "userClick.answerQuestion.userClick.time,userClick.answerQuestion.userClick.1970Sec,"
                                                "userClick.answerQuestion.userClick.decisionPoint,userClick.answerQuestion.userClick.questionId,"
                                                "OMIT,userClick.answerQuestion.userClick.coordX,userClick.answerQuestion.userClick.coordY,"
                                                "OMIT,userClick.answerQuestion.userClick.region,OMIT,userClick.answerQuestion.userClick.target,"
                                                "OMIT,userClick.answerQuestion.userClick.selectedRewardBar")
    #For click on saliencyMap
    extractionMap["answerQuestion.userClick.clickSaliencyMap"] = ("fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,"
                                            "userClick.region,OMIT,userClick.target,OMIT,userClick.answerQuestion.clickStep,"
                                            "userClick.answerQuestion.questionIndex,userClick.answerQuestion.answer1,"
                                            "userClick.answerQuestion.answer2,"
                                                "userClick.answerQuestion.userClick.fileName,userClick.answerQuestion.userClick.date,"
                                                "userClick.answerQuestion.userClick.time,userClick.answerQuestion.userClick.1970Sec,"
                                                "userClick.answerQuestion.userClick.decisionPoint,userClick.answerQuestion.userClick.questionId,"
                                                "OMIT,userClick.answerQuestion.userClick.coordX,userClick.answerQuestion.userClick.coordY,"
                                                "OMIT,userClick.answerQuestion.userClick.region,OMIT,userClick.answerQuestion.userClick.target,"
                                                "OMIT,userClick.answerQuestion.userClick.clickSaliencyMap,"
                                                "userClick.answerQuestion.userClick.clickSaliencyMap.clickGameEntity,"
                                                "userClick.answerQuestion.userClick.clickSaliencyMap.clickQuadrant")

    extractionMap["timelineClick"] =              "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.timelineClick"
    extractionMap["jumpToDecisionPoint"] =        "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.jumpToDecisionPoint"
    extractionMap["clickTimeLineBlocker"] =       "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.clickTimeLineBlocker" # add logic so if NA change to yes
    extractionMap["play"] =                       "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.play" # add logic so if NA change to yes
    extractionMap["pause"] =                      "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.pause" # add logic so if NA change to yes
    extractionMap["touchStepProgressLabel"] =     "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.touchStepProgressLabel" # add logic so if NA change to yes
    extractionMap["clickGameQuadrant"] =          "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.clickGameQuadrant"
    extractionMap["clickEntity"] =                "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.clickEntity.clickGameEntity,userClick.clickEntity.clickQuadrant,userClick.clickEntity.coordX,userClick.clickEntity.coordY"
    extractionMap["clickActionLabel"] =           "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.clickActionLabel"
    extractionMap["clickActionLabelDenied"] =     "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.clickActionLabelDenied"
    extractionMap["selectedRewardBar"] =          "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.selectedRewardBar"
    extractionMap["clickSaliencyMap"] =           "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.clickSaliencyMap,userClick.clickSaliencyMap.clickGameEntity,userClick.clickSaliencyMap.clickQuadrant"
    extractionMap["startMouseOverSaliencyMap"] =  "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,region:userClick.region,OMIT,userClick.target,OMIT,startMouseOverSaliencyMap"
    extractionMap["endMouseOverSaliencyMap"] =    "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,region:userClick.region,OMIT,userClick.target,OMIT,endMouseOverSaliencyMap"
    extractionMap["touchCumRewardLabel"] =        "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.touchCumRewardLabel"
    extractionMap["touchCumRewardValueFor"] =     "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.touchCumRewardValueFor"

    return extractionMap