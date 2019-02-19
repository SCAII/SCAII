import sys
from flatten import get_key_for_line
from extractionMap import get_extraction_map
from datetime import datetime, date, time

errors = {}
ignored_lines = []
primary_type_field_index = 6
questions = {}
summary_output = ""

def histogram(lines, filename, verbose, treatment):
    global summary_output
    errors["histogram"] = []
    hist = {}
    types = get_events_for_treatment(treatment)
    if verbose:
        print("{} lines in file {}".format(len(lines), filename))
    else:
        summary_output = "{:5d} lines in file {}".format(len(lines), filename)
    line_num = 1
    for line in lines:
        t = get_type_for_line(line, line_num, types)
        if t == "UNKOWN":
            errors["histogram"].append("line {} had unknown type: {}".format(line_num, line))
        hist[t] = hist.get(t, 0) + 1
        line_num += 1

    if verbose:
        print("\nline types present")
        for typ in types:
            if (typ in hist):
                print("\t{}\t\t{}".format(hist[typ], typ))

        print("\nmissing line types:")
        for typ in types:
            if not (typ in hist):
                print("\t{}\t\t{}".format(0, typ))

        if "UNKNOWN" in hist:
            print("\nunknown line types:")
            print("\t{}\t\t{}".format(hist["UNKNOWN"], "UNKNOWN"))

def get_type_for_line(line, line_num, types):
    errors["get_type_for_line"] = []
    t = "UNKNOWN"
    fields = line.split(',')
    if len(fields) < 7:
        errors["get_type_for_line"].append("ERROR - malformed line detected at line {} :  {}".format(line_num, line))
        return "UNKNOWN"
    #print("{}".format(line))
    if ("userClick" in line):
        t = get_type_for_user_click_line(line)
    elif ("startMouseOverSaliencyMap" in line):
        t = "startMouseOverSaliencyMap"
    elif ("endMouseOverSaliencyMap" in line):
        t = "endMouseOverSaliencyMap"
    elif ("waitForResearcherStart" in line):
        t = "waitForResearcherStart"
    elif ("waitForResearcherEnd" in line):
        t = "waitForResearcherEnd"
    else:
        # uses primary discriminator as key
        field  = fields[primary_type_field_index]
        subfields = field.split(';')
        subfield0 = subfields[0]
        subsubfields = subfield0.split(':')
        t = subsubfields[0]
    if not t in types:
        errors["get_type_for_line"].append("ERROR - unknown type '{}' detected at line {} :  {}".format(t, line_num, line))
    return t

def get_type_for_user_click_line(line):
    t = "UNKNOWN"
    if ("(NA)" in line or "NA;NA,false,false,false,false,false,false" in line):
        t = "userClick"
    else:
        parts = line.split(",")
        user_click_type_field = parts[primary_type_field_index]
        user_click_subfields = user_click_type_field.split(";")
        user_click_type_subfield = user_click_subfields[3]
        type_subfield_parts = user_click_type_subfield.split(":")
        t = type_subfield_parts[0]
    return t

def get_treatment_from_filename(filepath, verbose):
    import ntpath
    fname = ntpath.basename(filepath)
    parts = fname.split(".")
    fileroot = parts[0]
    fileroot_parts = fileroot.split("_")
    if len(fileroot_parts) != 3:
        print("filename malformed - missing treatmentID - should be answers_<participantID>_<treatmentID>.txt")
        sys.exit(0)
    if fileroot_parts[0] != "answers":
        print("filename malformed - filename should start with 'answers_' -  answers_<participantID>_<treatmentID>.txt")
        sys.exit(0)
    treatment = fileroot_parts[2]
    if verbose:
        print("found treatment {}".format(treatment))
    if (treatment != "0" and treatment != "1" and treatment != "2" and treatment!= "3"):
        print("unknown treatmentId in filename - should be one of 0,1,2,3")
        sys.exit(0)
    return treatment

def get_events_for_treatment(t):
    map = {}
    map["stepIntoDecisionPoint"]      = [ "0", "1", "2", "3"]
    map["showQuestion"]               = [ "0", "1", "2", "3"]
    map["hideEntityTooltips"]         = [ "0", "1", "2", "3"]
    map["showEntityTooltip"]          = [ "0", "1", "2", "3"]
    map["userClick"]                  = [ "0", "1", "2", "3"]
    map["answerQuestion"]             = [ "0", "1", "2", "3"]
    map["timelineClick"]              = [ "0", "1", "2", "3"]
    map["jumpToDecisionPoint"]        = [ "0", "1", "2", "3"]
    map["clickTimeLineBlocker"]       = [ "0", "1", "2", "3"]
    #map["rewind"]                     = [ "0", "1", "2", "3"]
    map["play"]                       = [ "0", "1", "2", "3"]
    map["pause"]                      = [ "0", "1", "2", "3"]
    map["touchStepProgressLabel"]     = [ "0", "1", "2", "3"]
    map["clickGameQuadrant"]          = [ "0", "1", "2", "3"]
    map["clickEntity"]                = [ "0", "1", "2", "3"]
    map["clickActionLabel"]           = [ "0", "1", "2", "3"]
    map["clickActionLabelDenied"]     = [ "0", "1", "2", "3"]
    map["selectedRewardBar"]          = [           "2", "3"]
    map["clickSaliencyMap"]           = [      "1",      "3"]
    map["startMouseOverSaliencyMap"]  = [      "1",      "3"]
    map["endMouseOverSaliencyMap"]    = [      "1",      "3"]
    map["touchCumRewardLabel"]        = [ "0", "1", "2", "3"]
    map["touchCumRewardValueFor"]     = [ "0", "1", "2", "3"]
    map["waitForResearcherStart"]     = [ "0", "1", "2", "3"]
    map["waitForResearcherEnd"]       = [ "0", "1", "2", "3"]
    result = []
    for key in map:
        treatments_supported = map[key]
        if t in treatments_supported:
            result.append(key)
    result.sort()
    return result

def tasks_present_check(lines,verbose):
    errors["tasks_present_check"] = []
    if verbose:
        print("\ntask integrity checking...")
    prior_file = ""
    files_seen = []
    for line in lines:
        parts = line.split(",")
        cur_file = parts[0]
        if (cur_file != prior_file):
            # skip the first row
            if (cur_file != "date"):
                files_seen.append(parts[0])
        prior_file = cur_file
    if is_correct_files_in_play(files_seen):
        if verbose:
            print("all tasks represented by log entries.")

def is_correct_files_in_play(files):
    if not ("tutorial.scr" in files):
        errors["tasks_present_check"].append("no log lines present for tutorial.scr")
        return False
    if not ("task1.scr" in files):
        errors["tasks_present_check"].append("no log lines present for task1.scr")
        return False
    if not ("task2.scr" in files):
        errors["tasks_present_check"].append("no log lines present for task2.scr")
        return False
    if not ("task3.scr" in files):
        errors["tasks_present_check"].append("no log lines present for task3.scr")
        return False
    if not ("task4.scr" in files):
        errors["tasks_present_check"].append("no log lines present for task4.scr")
        return False
    return True


def q_and_a_integrity(lines, treatment, verbose):
    errors["q_and_a_integrity"] = []
    if verbose:
        print("\nq_and_a integrity checking...")
    # make key with filename+question_id
    register = {}
    keys_seen = []
    for line in lines:
        parts = line.split(",")
        cur_file = parts[0]
        if "showQuestion" in line:
            question_id = line.split(",")[primary_type_field_index].split(":")[1]
            #print("showQuestion   {}".format(question_id))
            key = cur_file + "_" + question_id
            if not(key in keys_seen):
                keys_seen.append(key)
            if not(key in register):
                register[key] = "posed,"
            else:
                register[key] = register[key] + "posed,"
            

        if "answerQuestion" in line:
            question_id = line.split(",")[primary_type_field_index].split(";")[3].split("_")[0].split(":")[1]
            #print("answerQuestion {}".format(question_id))
            key = cur_file + "_" + question_id
            if not(key in keys_seen):
                keys_seen.append(key)
            if not(key in register):
                register[key] = "answered,"
            else:
                register[key] = register[key] + "answered,"

    for key in keys_seen:
        value = register[key]
        if value == "posed,":
            if verbose:
                print("  \t{}\t\t{}\t***  ERROR! ***".format(key, value))
            errors["q_and_a_integrity"].append("  \t{}\t\t{}\tERROR - question posed, not answered".format(key, value))
        elif value == "answered,":
            if verbose:
                print("  \t{}\t\t{}\t***  ERROR! ***".format(key, value))
            errors["q_and_a_integrity"].append("  \t{}\t\t{}\tERROR - question answered, not posed".format(key, value))
        elif value != "posed,answered,":
            if verbose:
                print("  \t{}\t\t{}\t***  ERROR! ***".format(key, value))
            errors["q_and_a_integrity"].append("  \t{}\t\t{}\tERROR - should have been 'posed,answered,'".format(key, value))
        else:
            if verbose:
                print("OK\t{}".format(key))
    question_file_questions = questions[treatment]
    ensure_all_questions_present(keys_seen, question_file_questions, treatment)


def ensure_all_questions_present(seen, needed, treatment):
    matches = []
    for key in seen:
        if key in needed:
            matches.append(key)
    for match in matches:
        needed.remove(match)
    for match in matches:
        seen.remove(match)
    for missing in needed:
        errors["q_and_a_integrity"].append("  \tERROR - treatment{} question {} not reflected in answer file".format(treatment,missing))
    for extra in seen:
        errors["q_and_a_integrity"].append("  \tERROR - treatment{} question {} present but not in original question file".format(treatment, extra))

def header_check(lines, verbose):
    errors["header_check"] = []
    cnt = 0
    if verbose:
        print("\nq_and_a integrity checking...")
    for line in lines:
        if ("date,time,secSince1970,decisionPoint,questionId,userAction" in line):
            cnt += 1

    if(cnt > 1):
        errors["header_check"].append("found too many header lines : {}".format(cnt))
        if verbose:
            print("Error! Looks like the logfile contains data from more than one session")
    if(cnt == 0):
        errors["header_check"].append("Header line missing - should start with 'date,time,secSince1970'")
        if verbose:
            print("Looks like the logfile is missing the header file")


    
def load_reference_questions():
    questions["0"] = ["task1.scr_1.0","task1.scr_1.1","task1.scr_1.2","task1.scr_61.0","task1.scr_61.1","task1.scr_61.2","task1.scr_82.0","task1.scr_82.1","task1.scr_82.2","task1.scr_114.0","task1.scr_114.1","task1.scr_114.2","task2.scr_1.0","task2.scr_1.1","task2.scr_1.2","task2.scr_59.0","task2.scr_59.1","task2.scr_59.2","task2.scr_82.0","task2.scr_82.1","task2.scr_82.2","task2.scr_121.0","task2.scr_121.1","task2.scr_121.2","task3.scr_1.0","task3.scr_1.1","task3.scr_1.2","task3.scr_56.0","task3.scr_56.1","task3.scr_56.2","task3.scr_99.0","task3.scr_99.1","task3.scr_99.2","task4.scr_1.0","task4.scr_1.1","task4.scr_1.2","task4.scr_63.0","task4.scr_63.1","task4.scr_63.2","task4.scr_105.0","task4.scr_105.1","task4.scr_105.2","task4.scr_summary.0","tutorial.scr_1.0","tutorial.scr_1.1","tutorial.scr_75.0","tutorial.scr_75.1","tutorial.scr_75.2","tutorial.scr_124.0","tutorial.scr_124.1","tutorial.scr_summary.0"]
    questions["1"] = ["task1.scr_1.0","task1.scr_1.1","task1.scr_1.2","task1.scr_61.0","task1.scr_61.1","task1.scr_61.2","task1.scr_82.0","task1.scr_82.1","task1.scr_82.2","task1.scr_114.0","task1.scr_114.1","task1.scr_114.2","task2.scr_1.0","task2.scr_1.1","task2.scr_1.2","task2.scr_59.0","task2.scr_59.1","task2.scr_59.2","task2.scr_82.0","task2.scr_82.1","task2.scr_82.2","task2.scr_121.0","task2.scr_121.1","task2.scr_121.2","task3.scr_1.0","task3.scr_1.1","task3.scr_1.2","task3.scr_56.0","task3.scr_56.1","task3.scr_56.2","task3.scr_99.0","task3.scr_99.1","task3.scr_99.2","task4.scr_1.0","task4.scr_1.1","task4.scr_1.2","task4.scr_63.0","task4.scr_63.1","task4.scr_63.2","task4.scr_105.0","task4.scr_105.1","task4.scr_105.2","task4.scr_summary.0","tutorial.scr_1.0","tutorial.scr_1.1","tutorial.scr_75.0","tutorial.scr_75.1","tutorial.scr_75.2","tutorial.scr_124.0","tutorial.scr_124.1","tutorial.scr_124.2","tutorial.scr_summary.0"]
    questions["2"] = ["task1.scr_1.0","task1.scr_1.1","task1.scr_1.2","task1.scr_61.0","task1.scr_61.1","task1.scr_61.2","task1.scr_82.0","task1.scr_82.1","task1.scr_82.2","task1.scr_114.0","task1.scr_114.1","task1.scr_114.2","task2.scr_1.0","task2.scr_1.1","task2.scr_1.2","task2.scr_59.0","task2.scr_59.1","task2.scr_59.2","task2.scr_82.0","task2.scr_82.1","task2.scr_82.2","task2.scr_121.0","task2.scr_121.1","task2.scr_121.2","task3.scr_1.0","task3.scr_1.1","task3.scr_1.2","task3.scr_56.0","task3.scr_56.1","task3.scr_56.2","task3.scr_99.0","task3.scr_99.1","task3.scr_99.2","task4.scr_1.0","task4.scr_1.1","task4.scr_1.2","task4.scr_63.0","task4.scr_63.1","task4.scr_63.2","task4.scr_105.0","task4.scr_105.1","task4.scr_105.2","task4.scr_summary.0","tutorial.scr_1.0","tutorial.scr_1.1","tutorial.scr_75.0","tutorial.scr_75.1","tutorial.scr_75.2","tutorial.scr_124.0","tutorial.scr_124.1","tutorial.scr_124.2","tutorial.scr_summary.0"]
    #questions["3"] = ["task1.scr_1.0","task1.scr_1.1","task1.scr_1.2","task1.scr_1.3","task1.scr_61.0","task1.scr_61.1","task1.scr_61.2","task1.scr_61.3","task1.scr_82.0","task1.scr_82.1","task1.scr_82.2","task1.scr_82.3","task1.scr_114.0","task1.scr_114.1","task1.scr_114.2","task1.scr_114.3","task2.scr_1.0","task2.scr_1.1","task2.scr_1.2","task2.scr_1.3","task2.scr_59.0","task2.scr_59.1","task2.scr_59.2","task2.scr_59.3","task2.scr_82.0","task2.scr_82.1","task2.scr_82.2","task2.scr_82.3","task2.scr_121.0","task2.scr_121.1","task2.scr_121.2","task2.scr_121.3","task3.scr_1.0","task3.scr_1.1","task3.scr_1.2","task3.scr_1.3","task3.scr_56.0","task3.scr_56.1","task3.scr_56.2","task3.scr_56.3","task3.scr_99.0","task3.scr_99.1","task3.scr_99.2","task3.scr_99.3","task4.scr_1.0","task4.scr_1.1","task4.scr_1.2","task4.scr_1.3","task4.scr_63.0","task4.scr_63.1","task4.scr_63.2","task4.scr_62.3","task4.scr_105.0","task4.scr_105.1","task4.scr_105.2","task4.scr_105.3","task4.scr_summary.0","tutorial.scr_1.1","tutorial.scr_1.2","tutorial.scr_75.0","tutorial.scr_75.1","tutorial.scr_75.2","tutorial.scr_75.3","tutorial.scr_124.0","tutorial.scr_124.1","tutorial.scr_summary.0"]
    questions["3"] = ["task1.scr_1.0","task1.scr_1.1","task1.scr_1.2","task1.scr_1.3","task1.scr_61.0","task1.scr_61.1","task1.scr_61.2","task1.scr_61.3","task1.scr_82.0","task1.scr_82.1","task1.scr_82.2","task1.scr_82.3","task1.scr_114.0","task1.scr_114.1","task1.scr_114.2","task1.scr_114.3","task2.scr_1.0","task2.scr_1.1","task2.scr_1.2","task2.scr_1.3","task2.scr_59.0","task2.scr_59.1","task2.scr_59.2","task2.scr_59.3","task2.scr_82.0","task2.scr_82.1","task2.scr_82.2","task2.scr_82.3","task2.scr_121.0","task2.scr_121.1","task2.scr_121.2","task2.scr_121.3","task3.scr_1.0","task3.scr_1.1","task3.scr_1.2","task3.scr_1.3","task3.scr_56.0","task3.scr_56.1","task3.scr_56.2","task3.scr_56.3","task3.scr_99.0","task3.scr_99.1","task3.scr_99.2","task3.scr_99.3","task4.scr_1.0","task4.scr_1.1","task4.scr_1.2","task4.scr_1.3","task4.scr_63.0","task4.scr_63.1","task4.scr_63.2","task4.scr_63.3","task4.scr_105.0","task4.scr_105.1","task4.scr_105.2","task4.scr_105.3","task4.scr_summary.0","tutorial.scr_1.0","tutorial.scr_1.1","tutorial.scr_1.2","tutorial.scr_75.0","tutorial.scr_75.1","tutorial.scr_75.2","tutorial.scr_124.0","tutorial.scr_124.1","tutorial.scr_124.2","tutorial.scr_summary.0"]


def blank_line_check(lines, verbose):
    errors["blank_line_check"] = []
    line_cnt = 0
    if verbose:
        print("\nblank_line_check checking...")
    for line in lines:
        line_cnt += 1
        if (line == '\n'):
            errors["blank_line_check"].append("found entry with no information : {}".format(line_cnt))
            if verbose:
                print("ERROR! Looks like logfile contains entry with no information (blank) : {}".format(line_cnt))

def answer_question_integrity(lines, verbose):
    errors["answer_question_integrity"] = []
    line_cnt = 0
    user_click_entity = ""
    user_click_rewardbar = ""
    user_click_saliency = ""
    types_user_click = [user_click_entity, user_click_rewardbar, user_click_saliency]
    if verbose:
        print("\nanswer_question_integrity checking...")
    for line in lines:
        line_cnt += 1
        if (("button-save" in line) and (not "(NA)" in line)):
            if ((types_user_click[0] != "") and ("clickEntity" in line) and (types_user_click[0] not in line)):
                errors["answer_question_integrity"].append("ERROR - answer question with clickEntity answer not found in earlier log entries : {}".format(line_cnt))
                if verbose:
                    print("Error! Looks like logfile contains an entry in the saved answer not found previously in the log file")
            elif ((types_user_click[1] != "") and "selectedRewardBar" in line and (types_user_click[1] not in line)):
                errors["answer_question_integrity"].append("ERROR - answer question with selectedRewardBar answer not found in earlier log entries : {}".format(line_cnt))
                if verbose:
                    print("Error! Looks like logfile contains an entry in the saved answer not found previously in the log file")
            elif ((types_user_click[2] != "") and "clickSaliencyMap" in line and (types_user_click[2] not in line)):
                errors["answer_question_integrity"].append("ERROR - answer question with clickSaliencyMap answer not found in earlier log entries : {}".format(line_cnt))
                if verbose:
                    print("Error! Looks like logfile contains an entry in the saved answer not found previously in the log file")
        elif ("clickEntity" in line):
            temp_user_click_entity = line
            types_user_click[0] = temp_user_click_entity.replace("\n", "")
        elif ("selectedRewardBar" in line):
            temp_user_click_rewardbar = line
            types_user_click[1] = temp_user_click_rewardbar.replace("\n", "")
        elif ("clickSaliencyMap" in line):
            temp_user_click_saliency = line
            types_user_click[2] = temp_user_click_saliency.replace("\n", "")
        
def waitscreen_integrity(lines, verbose):
    errors["waitscreen_integrity"] = []
    line_cnt = 0
    startscreen_cnt = 0
    endscreen_cnt = 0
    if verbose:
        print("\nwaitscreen_integrity checking...")
    for line in lines:
        line_cnt += 1
        if ("waitForResearcherStart" in line):
            startscreen_cnt += 1
            if (startscreen_cnt != (endscreen_cnt + 1)):
                errors["waitscreen_integrity"].append("ERROR - waitScreen start and end logs are unequal. Unmatched case start:{} != end:{} : line:{}".format(startscreen_cnt, (endscreen_cnt + 1), line_cnt))
                if verbose:
                    print("Error! Looks like logfile has unmatched case for start or end screen log entires : start count: {} != end count: {} : Line:{}".format(startscreen_cnt, endscreen_cnt, line_cnt))
                startscreen_cnt = endscreen_cnt + 1
        elif ("waitForResearcherEnd" in line):
            endscreen_cnt += 1
            if (startscreen_cnt != endscreen_cnt):
                errors["waitscreen_integrity"].append("ERROR - waitScreen start and end logs are unequal. Unmatched case start:{} != end:{} : line:{}".format(startscreen_cnt, endscreen_cnt, line_cnt))
                if verbose:
                    print("Error! Looks like logfile has unmatched case for start or end screen log entires : start count: {} != end count: {} : Line:{}".format(startscreen_cnt, endscreen_cnt, line_cnt))
                startscreen_cnt = endscreen_cnt
    if (startscreen_cnt != endscreen_cnt):
        errors["waitscreen_integrity"].append("ERROR - waitScreen start and end logs are unequal. ")
        if verbose:
            print("Error! Looks like logfile has unmatched case for start or end screen log entires : start count: {} != end count: {}".format(startscreen_cnt, endscreen_cnt))
    
def timesequence_integrity(lines, verbose):
    errors["timesequence_integrity"] = []
    prior_dt = datetime.strptime("1/1/18 00:01", "%d/%m/%y %H:%M")
    prior_sec_1970 = int("1500000000000")
    if verbose:
        print("\ntimesequence_integrity checking...")
    line_num = 1
    for line in lines:
        fields = line.split(",")
        date_field = fields[1]
        time_field = fields[2]
        sec_1970 = int(fields[3])
        if sec_1970 < prior_sec_1970:
            errors["timesequence_integrity"].append("sec_1970 sequence out of order at line {}: prior line: {} ... this line {}".format(line_num, prior_sec_1970,sec_1970))
        
        #9-19-2018,16:45:26:91
        [month,day, year] = date_field.split("-")
        [h, m, s, msec] = time_field.split(":")
        d = date(int(year), int(month), int(day))
        t = time(int(h),int(m),int(s),int(msec))
        dt = datetime.combine(d, t)
        #print("datetime: {}".format(dt))
        if (dt < prior_dt):
            errors["timesequence_integrity"].append("Time sequence outof order at line {}: prior line: {} ... this line {}".format(line_num, prior_dt,dt))
        prior_dt = dt
        prior_sec_1970 = sec_1970
        line_num += 1

def get_error_count(error_lists):
    count = 0
    for k,v in error_lists.items():
        for error in v:
            count += 1
    return count

def filter_lines_to_ignore(lines):
    result = []
    header_lines = []
    for line in lines:
        if line.startswith("#") or line.startswith("clickHitPoints"):
            ignored_lines.append(line)
        elif line.startswith("date"):
            header_lines.append(line)
        else:
            result.append(line)
    return result

def start_log_check(verbose, filepath):
    treatment = get_treatment_from_filename(filepath, verbose)
    f = open(filepath)
    lines = f.readlines()
    f.close()
    header_check(lines, verbose)

    lines = filter_lines_to_ignore(lines)
    load_reference_questions()
    blank_line_check(lines, verbose)
    histogram(lines, filepath, verbose, treatment)
    tasks_present_check(lines, verbose)
    q_and_a_integrity(lines, treatment, verbose)
    
    answer_question_integrity(lines, verbose)
    waitscreen_integrity(lines, verbose)
    timesequence_integrity(lines, verbose)

    error_flip = False
    if verbose:
        for key in errors:
            error_list = errors[key]
            if len(error_list) == 0:
                print("\tpass\t{}".format(key))
            else:
                print("\tFAIL\t{}".format(key))
                for error in error_list:
                    print("\t\t\t{}".format(error))
                error_flip = True

        if (len(ignored_lines) > 0):
            print("\n\n\tIGNORED {} lines".format(len(ignored_lines)))
            for line in ignored_lines:
                print("\n\t\t{}".format(line))
            error_flip = True
    else:
        if get_error_count(errors) > 0:
            print("[{}]  =======>> FAIL".format(summary_output))
        else:
            print("{}\tp".format(summary_output))
    return error_flip



if __name__ == '__main__':
    start_log_check(True,sys.argv[1])
