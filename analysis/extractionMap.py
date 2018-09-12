def get_extraction_map() {
    templateMap = {}
    templateMap["stepIntoDecisionPoint"] =  "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,stepIntoDecisionPoint"
    templateMap["showQuestion"] =           "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,showQuestion"
    templateMap["hideEntityTooltips"] =     "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,hideEntityTooltips"
    templateMap["showEntityTooltip"] =      "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,showEntityTooltip.entityInfo,showEntityTooltip.tipQuadrant"

    #For click on gamemap
    templateMap["button-save"] =            ("fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,"
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
    templateMap["button-save"] =            ("fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,"
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
    templateMap["button-save"] =            ("fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,"
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

    templateMap["expl-control-canvas"] =    "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.timelineClick"
    templateMap["decisionPointList"] =      "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.jumpToDecisionPoint"
    templateMap["right-block-div"] =        "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.clickTimeLineBlocker" # add logic so if NA change to yes
    templateMap["rewindButton"] =           "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.rewind" # add logic so if NA change to yes
    templateMap["playButton"] =             "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.play" # add logic so if NA change to yes
    templateMap["pauseButton"] =            "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.pause" # add logic so if NA change to yes
    templateMap["touch-step-progress-label"] =  "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.touchStepProgressLabel" # add logic so if NA change to yes
    templateMap["gameboardBackground"] =    "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.clickGameQuadrant"
    templateMap["gameboard"] =              "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.clickEntity.clickGameEntity,userClick.clickEntity.clickQuadrant,userClick.clickEntity.coordX,userClick.clickEntity.coordY"
    templateMap["clickActionLabel"] =       "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.clickActionLabel"
    templateMap["clickActionLabelDenied"] = "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.clickActionLabelDenied"
    templateMap["selectedRewardBar"] =      "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.selectedRewardBar"
    templateMap["clickSaliencyMap"] =       "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.clickSaliencyMap,userClick.clickSaliencyMap.clickGameEntity,userClick.clickSaliencyMap.clickQuadrant"
    templateMap["startMouseOverSaliencyMap"] =  "fileName,date,time,1970Sec,decisionPoint,questionId,region:userClick.region,OMIT,userClick.target,OMIT,startMouseOverSaliencyMap"
    templateMap["endMouseOverSaliencyMap"] =    "fileName,date,time,1970Sec,decisionPoint,questionId,region:userClick.region,OMIT,userClick.target,OMIT,endMouseOverSaliencyMap"
    templateMap["touchCumRewardLabel"] =    "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.touchCumRewardLabel"
    templateMap["touchCumRewardValueFor"] = "fileName,date,time,1970Sec,decisionPoint,questionId,OMIT,userClick.coordX,userClick.coordY,OMIT,userClick.region,OMIT,userClick.target,OMIT,userClick.touchCumRewardValueFor"
}