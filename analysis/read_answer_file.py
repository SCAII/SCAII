import sys
import os

import unittest

from flatten import get_blank_line_object
from flatten import replace_all_delimeters_with_commas
from flatten import get_key_for_line
from flatten import parse_line
import extractionMap as extractionMap


def main():
    # filepath = sys.argv[1]
    #of = open("../../../formatted_answer_9181396_3.txt")
    filepath = "../../../replays/answers_9181306_0.txt"

    # if not os.path.isfile(filepath):
    #     print("File path {} does not exist. Exiting...".format(filepath))


    with open(filepath) as fp:
        cnt = 0
        for line in fp:
            # print("line {}").format(cnt)
            if ("date,time,secSince1970,decisionPoint,questionId,userAction" in line):
                print()
            else:
                extraction_map = extractionMap.get_extraction_map()
                obj = parse_line(line,extraction_map)
                #of.write(obj)
            cnt += 1

if __name__ == '__main__':
    main()