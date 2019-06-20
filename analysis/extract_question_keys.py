import os
import sys


def remove_comments(lines):
    result = []
    for line in lines:
        if not line.startswith("#"):
            result.append(line)
    return result

def remove_blank_lines(lines):
    result = []
    for line in lines:
        if not (line == "" or line == "\n"):
            result.append(line)
    return result

def generate_output(dir,treatment):
    files_and_dirs = os.listdir(dir)
    s = 'questions["{}"] = ['.format(treatment)
    for f in files_and_dirs:
        parts = f.split(".")
        if parts[1] == "txt":
            #task1_questions_9181306_0
            rootparts = parts[0].split("_")
            taskname = rootparts[0]
            if treatment !=rootparts[3]:
                print("ERROR - treatmentID {} in dirname not the same as file in that dir {}", treatment, rootparts[3])
                sys.exit(0)
            info = express_questions(os.path.join(dir, f), taskname)
        s = '{}{}'.format(s, info)
    #remove trailing comma
    s = s.rstrip(',')
    s = '{}]'.format(s)
    print(s)

def express_questions(path, taskname):
    #   questions["3"].append("tutorial.scr_1.1")
    f = open(path)
    lines = remove_blank_lines(remove_comments(f.readlines()))
    s = ""
    for line in lines:
        #print("line: {}".format(line))
        lineparts = line.split(";")
        questionId = "{}.{}".format(lineparts[0], lineparts[1])
        s = '{}"{}.scr_{}",'.format(s, taskname, questionId)
    return s
    

def express_questions_column(path, taskname, treatment):
    #   questions["3"].append("tutorial.scr_1.1")
    f = open(path)
    lines = remove_blank_lines(remove_comments(f.readlines()))
    for line in lines:
        #print("line: {}".format(line))
        lineparts = line.split(";")
        questionId = "{}.{}".format(lineparts[0], lineparts[1])
        print('\tquestions["{}"] = "{}.scr_{}"'.format(treatment, taskname, questionId))
if __name__ == '__main__':
    rootdir = sys.argv[1]
    generate_output(os.path.join(rootdir,"treatment0"),"0")
    generate_output(os.path.join(rootdir,"treatment1"),"1")
    generate_output(os.path.join(rootdir,"treatment2"),"2")
    generate_output(os.path.join(rootdir,"treatment3"),"3")