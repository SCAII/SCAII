def parse_line(line, extraction_map):
    key = get_key_for_line(line)
    extraction_guide = extraction_map[key]
    obj = get_blank_line_object()
    final_line = replace_all_delimeters_with_commas(line)
    guide_parts = extraction_guide.split(",")
    final_line_parts = final_line.split(",")
    if (len(guide_parts) != len(final_line_parts)):
        print("ERROR - guide field count {} line field count {}".format(len(guide_parts),len(final_line_parts)))
        print("original line    : {}".format(line))
        print("all commas line  : {}".format(final_line))
        print("extraction guide : {}".format(extraction_guide))
        raise SystemExit
    field_count = len(guide_parts)
    for i in range(field_count):
        col_name = guide_parts[i]
        if (col_name != "OMIT"):
            obj[col_name] = final_line_parts[i]
    return obj

def replace_all_delimeters_with_commas(line):
    no_colons = line.replace(":",",")
    no_semicolons = no_colons.replace(";", ",")
    no_underscores = no_semicolons.replace("_",",")
    no_left_parens = no_underscores.replace("(",",")
    no_right_parens = no_left_parens.replace(")",",")
    return no_right_parens

def get_key_for_line(line):
    key = "UNKNOWN"
    fields = line.split(',')
    if ("userClick" in line):
        key = get_key_for_user_click_line(line)
    elif ("startMouseOverSaliencyMap" in line):
        key = "startMouseOverSaliencyMap"
    elif ("endMouseOverSaliencyMap" in line):
        key = "endMouseOverSaliencyMap"
    else:
        # uses primary discriminator as key
        field  = fields[6]
        subfields = field.split(';')
        subfield0 = subfields[0]
        subsubfields = subfield0.split(':')
        key = subsubfields[0]
    return key

def get_key_for_user_click_line(line):
    if ("answerQuestion" in line):
        #need to look into the saved off click
        if ("(NA)" in line):
            key = "answerQuestion.userClick.NA"
        elif ("clickEntity" in line):
            key = "answerQuestion.userClick.clickEntity"
        elif ("selectedRewardBar" in line):
            key = "answerQuestion.userClick.selectedRewardBar"
        elif ("clickSaliencyMap" in line):
            key = "answerQuestion.userClick.clickSaliencyMap" 
    else:
        # use secondary discriminator as key
        fields = line.split(',')
        field  = fields[6]
        subfields = field.split(';')
        subfield3 = subfields[3]
        subsubfields = subfield3.split(':')
        key = subsubfields[0]
    return key

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
