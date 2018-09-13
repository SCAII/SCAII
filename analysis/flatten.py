def parse_line(line):
    key = ""
    fields = line.split('<')
    if ("answerQuestion" in line):
        # decide based on click info types

    else if ("userClick" in line):
        # use secondary discriminator as key
        primary_field  = fields[6]
        primary_field_parts = primary_field.split(':')

    else:
        # uses primary discriminator as key
        primary_field  = fields[6]
        primary_field_parts = primary_field.split(';')
        primary_field_first_part = primary_field_parts[0]
        key = primary_field_first_part_parts[0]


def get_blank_line_object():
    obj = {}
    obj["fileName"] = "NA"
    obj["date"] = "NA"
    obj["time"] = "NA"
    obj["1970Sec"] = "NA"
    obj["decisionPoint"] = "NA"
    obj["questionId"] = "NA"
    obj["stepIntoDecisionPoint"] = "NA"
    obj["showQuestion"] = "NA"
    obj["hideEntityTooltips"] = "NA"
    obj["showEntityTooltip.entityInfo"] = "NA"
    obj["showEntityTooltip.tipQuadrant"] = "NA"
    obj["startMouseOverSaliencyMap"] = "NA"
    obj["endMouseOverSaliencyMap"] = "NA"

    obj["userClick.coordX"] = "NA"
    obj["userClick.coordY"] = "NA"
    obj["userClick.region"] = "NA"
    obj["userClick.target"] = "NA"
    obj["userClick.answerQuestion.clickStep"] = "NA"
    obj["userClick.answerQuestion.questionIndex"] = "NA"
    obj["userClick.answerQuestion.answer1"] = "NA"
    obj["userClick.answerQuestion.answer2"] = "NA"

    obj["userClick.answerQuestion.userClick"] = "NA"
    obj["userClick.answerQuestion.userClick.fileName"] = "NA"
    obj["userClick.answerQuestion.userClick.date"] = "NA"
    obj["userClick.answerQuestion.userClick.time"] = "NA"
    obj["userClick.answerQuestion.userClick.1970Sec"] = "NA"
    obj["userClick.answerQuestion.userClick.decisionPoint"] = "NA"
    obj["userClick.answerQuestion.userClick.questionId"] = "NA"
    obj["userClick.answerQuestion.userClick.coordX"] = "NA"
    obj["userClick.answerQuestion.userClick.coordY"] = "NA"
    obj["userClick.answerQuestion.userClick.region"] = "NA"
    obj["userClick.answerQuestion.userClick.target"] = "NA"

    obj["userClick.answerQuestion.userClick.clickEntity.clickGameEntity"] = "NA"
    obj["userClick.answerQuestion.userClick.clickEntity.clickQuadrant"] = "NA"
    obj["userClick.answerQuestion.userClick.clickEntity.coordX"] = "NA"
    obj["userClick.answerQuestion.userClick.clickEntity.coordY"] = "NA"

    obj["userClick.answerQuestion.userClick.selectedRewardBar"] = "NA"

    obj["userClick.answerQuestion.userClick.clickSaliencyMap"] = "NA"
    obj["userClick.answerQuestion.userClick.clickSaliencyMap.clickGameEntity"] = "NA"
    obj["userClick.answerQuestion.userClick.clickSaliencyMap.clickQuadrant"] = "NA"

    obj["userClick.timelineClick"] = "NA"
    obj["userClick.jumpToDecisionPoint"] = "NA"
    obj["userClick.clickTimeLineBlocker"] = "NA"
    obj["userClick.rewind"] = "NA"
    obj["userClick.play"] = "NA"
    obj["userClick.pause"] = "NA"
    obj["userClick.touchStepProgressLabel"] = "NA"
    obj["userClick.clickGameQuadrant"] = "NA"

    obj["userClick.clickEntity.clickGameEntity"] = "NA"
    obj["userClick.clickEntity.clickQuadrant"] = "NA"
    obj["userClick.clickEntity.clickCoordX"] = "NA"
    obj["userClick.clickEntity.clickCoordY"] = "NA"

    obj["userClick.clickActionLabel"] = "NA"
    obj["userClick.clickActionLabelDenied"] = "NA"
    obj["userClick.selectedRewardBar"] = "NA"

    obj["userClick.clickSaliencyMap"] = "NA"
    obj["userClick.clickSaliencyMap.clickGameEntity"] = "NA"
    obj["userClick.clickSaliencyMap.clickQuadrant"] = "NA"

    obj["userClick.touchCumRewardLabel"] = "NA"
    obj["userClick.touchCumRewardValueFor"] = "NA"
    return obj
