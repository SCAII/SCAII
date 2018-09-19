import sys
from flatten import get_key_for_line
from extractionMap import get_extraction_map

def histogram(filename):
    hist = {}
    print("processing log file {}".format(filename))
    f = open(filename)
    lines = f.readlines()
    print("read {} lines".format(len(lines)))
    for line in lines:
        t = get_type_for_line(line)
        if t == "UNKOWN":
            print("line had unknown type: {}".format(line))
        hist[t] = hist.get(t, 0) + 1

    f.close()
    treatment = get_treatment_from_filename(filename)
    types = get_events_for_treatment(treatment)
    
    print("\n\nline types present")
    for typ in types:
        if (typ in hist):
            print("\t{}\t\t{}".format(hist[typ], typ))

    print("\n\nmissing line types:")
    for typ in types:
        if not (typ in hist):
            print("\t{}\t\t{}".format(0, typ))

    if "UNKNOWN" in hist:
        print("\n\nunknown line types:")
        print("\t{}\t\t{}".format(hist["UNKNOWN"], "UNKNOWN"))

def get_type_for_line(line):
    t = "UNKNOWN"
    fields = line.split(',')
    #print("{}".format(line))
    if ("userClick" in line):
        t = get_type_for_user_click_line(line)
    elif ("startMouseOverSaliencyMap" in line):
        t = "startMouseOverSaliencyMap"
    elif ("endMouseOverSaliencyMap" in line):
        t = "endMouseOverSaliencyMap"
    else:
        # uses primary discriminator as key
        field  = fields[6]
        subfields = field.split(';')
        subfield0 = subfields[0]
        subsubfields = subfield0.split(':')
        t = subsubfields[0]
    return t

def get_type_for_user_click_line(line):
    t = "UNKNOWN"
    if ("(NA)" in line):
        t = "userClick"
    else:
        parts = line.split(",")
        user_click_type_field = parts[6]
        user_click_subfields = user_click_type_field.split(";")
        user_click_type_subfield = user_click_subfields[3]
        type_subfield_parts = user_click_type_subfield.split(":")
        t = type_subfield_parts[0]
    return t

def get_treatment_from_filename(filepath):
    import ntpath
    fname = ntpath.basename(filepath)
    parts = fname.split(".")
    fileroot = parts[0]
    fileroot_parts = fileroot.split("_")
    treatment = fileroot_parts[2]
    print("found treatment {}".format(treatment))
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

def tasks_present_check(filepath):
    print("\n\ntask integrity checking...")
    f = open(filepath)
    lines = f.readlines()
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
    if not(is_correct_files_in_play(files_seen)):
        print("FAIL: files don't match the sequence tutorial, task1, task2, task3, task4")
        print(files_seen)
    else:
        print("PASS:Tasks data present for tutorial, task1, task2, task3, task4")
    f.close()

def is_correct_files_in_play(files):
    if (len(files) != 5):
        return False
    if (files[0] != "tutorial.scr"):
        return False
    if (files[1] != "task1.scr"):
        return False
    if (files[2] != "task2.scr"):
        return False
    if (files[3] != "task3.scr"):
        return False
    if (files[4] != "task4.scr"):
        return False
    return True

if __name__ == '__main__':
    histogram(sys.argv[1])
    tasks_present_check(sys.argv[1])