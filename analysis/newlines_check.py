import os
import sys
import log_check

def run(rootdir):
    process_treatment_dir(os.path.join(rootdir, "T0"))
    process_treatment_dir(os.path.join(rootdir, "T1"))
    process_treatment_dir(os.path.join(rootdir, "T2"))
    process_treatment_dir(os.path.join(rootdir, "T3"))
    
def process_treatment_dir(tdir):
    if not os.path.exists(tdir):
        print("ERROR path {} does not exist!".format(tdir))
        return
    files_and_dirs = os.listdir(tdir)
    for f in files_and_dirs:
        if f.startswith("answers") and f.endswith(".txt"):
            logpath = os.path.join(tdir, f)
            print(logpath)
            f = open(logpath)
            lines = f.readlines()
            for line in lines:
                if "ESCAPED-NEWLINE" in line:
                    print("ESCAPED-NEWLINE")
            f.close()

if __name__ == '__main__':
    run(sys.argv[1])