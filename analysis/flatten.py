def parse_line(line, extraction_map):
    print("---------parsing line------")
    key = get_key_for_line(line)
    extraction_guide = extraction_map[key]
    obj = get_blank_line_object()

    flag = special_line_case(key)
    answer_flag = special_answer_case(key)
    if (flag == True):
        line = escape_underscore(key, line)

    if (answer_flag == True):
        semi_final_line = replace_all_delimeters_with_commas_after_field_6_and_answer_field(key, line)
    else:
        semi_final_line = replace_all_delimeters_with_commas_after_field_6(line)
    
    # get rid of ignored data at end of line so can compare field counts.
    final_line = semi_final_line.replace(",false,false,false,false,false,false", "")
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
        if ("NOTE_PRESENCE" in col_name):
            col_name_parts = col_name.split(">")
            true_col_name = col_name_parts[1]
            obj[true_col_name] = "yes"
        elif (col_name == "OMIT"):
            # skip this one
            continue
        else:
            unescaped_value = unescape_all(final_line_parts[i])
            print("colname {} gets val {}".format(col_name, unescaped_value))
            obj[col_name] = unescaped_value
    return obj

def replace_all_delimeters_with_commas_after_field_6(line):
    fields = line.split(",")
    # go through each field, after the first 6
    new_string = ""
    for i in range(len(fields)):
        if (i == 0):
             new_string = "{}".format(fields[i])
        elif (i < 6):
            # copy without changing
            new_string = "{},{}".format(new_string, fields[i])
        else:
            # replace delims
            new_string = "{},{}".format(new_string, replace_all_delimeters_with_commas(fields[i]))
    return new_string

def replace_all_delimeters_with_commas(line):
    no_under_and_left_parens = line.replace("_(", ",")
    no_colons = no_under_and_left_parens.replace(":",",")
    no_semicolons = no_colons.replace(";", ",")
    no_underscores = no_semicolons.replace("_",",")
    no_left_parens = no_underscores.replace("(",",")
    no_right_parens = no_left_parens.replace(")","")
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
        if (key == "NA"):
            key = "userClick"
    return key

def special_line_case(key):
    if (key == "clickSaliencyMap" or key == "startMouseOverSaliencyMap" or key == "endMouseOverSaliencyMap"):
        return True
    else:
        return False

def special_answer_case(key):
    if (key == "answerQuestion.userClick.clickEntity" or key == "answerQuestion.userClick.selectedRewardBar" or key == "answerQuestion.userClick.clickSaliencyMap"):
        return True
    else:
        return False

def unescape_all(s):
    with_underscore = s.replace("ESCAPED-UNDERSCORE", "_")
    with_comma = with_underscore.replace("ESCAPED-COMMA", ",")
    with_colon = with_comma.replace("ESCAPED-COLON", ":")
    with_semicolon = with_colon.replace("ESCAPED-SEMICOLON", ";")
    return with_semicolon

def escape_underscore(key, line):
    if (key == "clickSaliencyMap"):
        fields = line.split(',')
        field = fields[6]
        subfields = field.split(';')
        subfield2 = subfields[2]
        subsubfields = subfield2.split(':')
        target_replace = subsubfields[1]
        new_target_replace = target_replace.replace("_", "ESCAPED-UNDERSCORE")


        subsubfields[1] = new_target_replace
        new_subsubfields = ':'.join([str(i) for i in subsubfields])
        subfields[2] = new_subsubfields
        new_subfields = ';'.join([str(j) for j in subfields])
        fields[6] = new_subfields
        new_line = ','.join([str(k) for k in fields])
        return new_line
    else: 
        new_line = line.replace("_", "ESCAPED-UNDERSCORE")
        return new_line

def replace_all_delimeters_with_commas_after_field_6_and_answer_field(key, line):


    entries = line.split('_(', 1)
    start_of_click_answer_entry = entries[1]
    find_end_of_click_answer = start_of_click_answer_entry.split(')')

    answer_entry = find_end_of_click_answer[0]
    button_save_info = entries[0]

    if (key == "answerQuestion.userClick.clickSaliencyMap"):
        answer_entry = escape_underscore("clickSaliencyMap", answer_entry)

    new_string = replace_all_delimeters_with_commas_after_field_6(button_save_info)
    new_answer_string = replace_all_delimeters_with_commas_after_field_6(answer_entry)

    new_new_string = new_string + ',' + new_answer_string

    return new_new_string

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

    obj["userClick"] = "NA"
    obj["userClick.coordX"] = "NA"
    obj["userClick.coordY"] = "NA"
    obj["userClick.region"] = "NA"
    obj["userClick.target"] = "NA"
    obj["userClick.answerQuestion.clickStep"] = "NA"
    obj["userClick.answerQuestion.questionId"] = "NA"
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
    obj["userClick.play"] = "NA"
    obj["userClick.pause"] = "NA"
    obj["userClick.touchStepProgressLabel"] = "NA"
    obj["userClick.clickGameQuadrant"] = "NA"

    obj["userClick.clickEntity.clickGameEntity"] = "NA"
    obj["userClick.clickEntity.clickQuadrant"] = "NA"
    obj["userClick.clickEntity.coordX"] = "NA"
    obj["userClick.clickEntity.coordY"] = "NA"

    obj["userClick.clickActionLabel"] = "NA"
    obj["userClick.clickActionLabelDenied"] = "NA"
    obj["userClick.selectedRewardBar"] = "NA"

    obj["userClick.clickSaliencyMap"] = "NA"
    obj["userClick.clickSaliencyMap.clickGameEntity"] = "NA"
    obj["userClick.clickSaliencyMap.clickQuadrant"] = "NA"

    obj["userClick.touchCumRewardLabel"] = "NA"
    obj["userClick.touchCumRewardValueFor"] = "NA"
    return obj
