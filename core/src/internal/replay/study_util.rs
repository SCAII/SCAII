use protos::{LogFileEntry, StudyQuestion, StudyQuestionAnswer, StudyQuestions};
use std::error::Error;
use std::path::PathBuf;
extern crate regex;
use self::regex::Regex;

pub struct UserStudyQuestions {
    pub replay_filename: String,
    pub answer_lines: Vec<String>,
}
impl UserStudyQuestions {
    #[allow(unused_assignments)]
    pub fn get_questions(&mut self) -> Result<Option<StudyQuestions>, Box<Error>> {
        use scaii_core;
        use std::fs::File;
        use std::io::prelude::*;
        use std::io::BufReader;
        println!(
            "Looking for question file for replay {}",
            self.replay_filename
        );
        let mut questionfile_path = scaii_core::get_default_replay_dir()?;
        let question_filename_root = get_question_filename_root_for_replay(&self.replay_filename);
        println!("question_filename root is {}", question_filename_root);
        let question_filename = get_filename_for_root(question_filename_root)?;
        let mut user_id = "".to_string();
        let mut treatment_id = "".to_string();
        let mut answer_filename = "".to_string();
        match question_filename {
            None => {
                return Ok(None);
            }
            Some(ref filename) => {
                user_id = get_field_from_filename(filename, 2 as u32);
                treatment_id = get_field_from_filename(filename, 3 as u32);
                answer_filename = filename.replace("question", "answer");
                let result = str::replace("Hello World!", "!", "?");
                println!("{}", result); // => "Hello World!"
                println!("user_id {} ", user_id);
                println!("treatment_id {}", treatment_id);
            }
        }
        questionfile_path.push(&question_filename.unwrap().as_str());
        println!("path is {:?}", questionfile_path);

        if check_file(questionfile_path.clone()).len() != 0 {
            panic!();
        }

        let f = File::open(questionfile_path)?;
        let reader = BufReader::new(f);

        let mut questions_vec: Vec<StudyQuestion> = Vec::new();
        for line in reader.lines() {
            let question_string = line.unwrap();
            if check_comments_or_nl(&question_string) {
                println!("STUDY QUESTION: {}", question_string);
                let question: StudyQuestion = self.get_study_question(&question_string)?;
                questions_vec.push(question);
            }
        }
        let study_questions = StudyQuestions {
            user_id: user_id,
            treatment_id: treatment_id,
            study_questions: questions_vec,
            answer_filename: answer_filename,
        };
        Ok(Some(study_questions))
    }

    fn get_study_question(&mut self, line: &String) -> Result<StudyQuestion, Box<Error>> {
        let line_parts_iterator = line.split(";");
        let vec: Vec<&str> = line_parts_iterator.collect();

        let step: String = vec[0].to_string();

        let question_index: String = vec[1].to_string();

        let question_type: String = vec[2].to_string();

        let question: String = vec[3].to_string();

        let mut answer_vec: Vec<String> = Vec::new();
        for x in 4..vec.len() {
            answer_vec.push(vec[x].to_string());
        }

        Ok(StudyQuestion {
            step: step,
            question: question,
            answers: answer_vec,
            question_id_for_step: question_index,
            question_type: question_type,
        })
    }

    pub fn persist_log_entry_incremental(&mut self, lfe: LogFileEntry) -> Result<(), Box<Error>> {
        use scaii_core;
        use std::fs::{File, OpenOptions};
        use std::io::Write;
        println!("{:?}", &lfe);
        let output_line = lfe.entry;

        let mut answerfile_path = scaii_core::get_default_replay_dir()?;
        let filename = lfe.filename;
        answerfile_path.push(filename);

        if !answerfile_path.exists() {
            File::create(&answerfile_path)?;
        }
        let mut file = OpenOptions::new()
            .append(true)
            .open(answerfile_path)
            .unwrap();
        file.write_all(output_line.as_bytes())?;
        file.write_all("\n".to_string().as_bytes())?;
        Ok(())
    }

    pub fn persist_study_question_answer(
        &mut self,
        sqa: StudyQuestionAnswer,
    ) -> Result<(), Box<Error>> {
        use scaii_core;
        use std::fs::{remove_file, File, OpenOptions};
        use std::io::Write;
        println!("{:?}", &sqa);
        let user_id = sqa.user_id;
        let treatment_id = sqa.treatment_id;
        let answer = sqa.answer;
        let question = sqa.question;
        let question_number = sqa.question_number;
        let step = sqa.step;
        let output_line = format!("{};{};{};{}", question_number, step, question, answer);
        self.answer_lines.push(output_line);

        if step == "summary".to_string() {
            let mut answerfile_path = scaii_core::get_default_replay_dir()?;
            // append to file called replayX_answers_userID_treatmentID.txt
            // or ??? replayX_answers_userID_sessionID_treatmentID.txt
            let filename = get_answer_filename(&self.replay_filename, &user_id, &treatment_id);
            answerfile_path.push(filename);
            if answerfile_path.exists() {
                remove_file(&answerfile_path)?;
            }
            println!("answerfile_path is {:?}", answerfile_path);
            File::create(&answerfile_path)?;
            let mut file = OpenOptions::new()
                .append(true)
                .open(answerfile_path)
                .unwrap();
            for line in &self.answer_lines {
                file.write_all(line.as_bytes())?;
                file.write_all("\n".to_string().as_bytes())?;
                //writeln!(file, format!("{}",line))?;
            }
        }

        Ok(())
    }
}

fn get_field_from_filename(filename: &String, index: u32) -> String {
    let filename_parts_iterator = filename.split(".");
    let vec: Vec<&str> = filename_parts_iterator.collect();
    let root = vec[0];
    let root_parts_iterator = root.split("_");
    let vec: Vec<&str> = root_parts_iterator.collect();
    vec[index as usize].to_string()
}

fn get_filename_for_root(root: String) -> Result<Option<String>, Box<Error>> {
    use scaii_core;
    use std::fs;
    let questionfile_path = scaii_core::get_default_replay_dir()?;
    for entry in fs::read_dir(questionfile_path)? {
        let entry = entry?;
        let path = entry.path();
        if !path.is_dir() {
            let filename = path.file_name().unwrap().to_str().unwrap().to_string();
            if filename.starts_with(root.as_str()) {
                println!("filename found was {}", filename);
                return Ok(Some(filename));
            }
        }
    }
    Ok(None)
}

fn get_question_filename_root_for_replay(filename: &String) -> String {
    let filename_parts_iterator = filename.split(".");
    let vec: Vec<&str> = filename_parts_iterator.collect();
    format!("{}_questions", vec[0])
}

// replayX_answers_userID_treatmentID.txt
fn get_answer_filename(filename: &String, user_id: &String, treatment_id: &String) -> String {
    let filename_parts_iterator = filename.split(".");
    let vec: Vec<&str> = filename_parts_iterator.collect();
    format!("{}_answers_{}_{}.txt", vec[0], user_id, treatment_id)
}

fn check_file(file: PathBuf) -> Vec<u8> {
    use std::fs::File;
    use std::io::{BufRead, BufReader};
    let f = File::open(&file).expect("Unable to open file");
    let f = BufReader::new(f);

    let mut errors: Vec<u8> = Vec::new();
    let mut line_num: u8 = 0;

    for line in f.lines() {
        line_num = line_num + 1;
        let q_string = line.unwrap();

        if check_comments_or_nl(&q_string) {
            let temp = check_question(&q_string, &line_num, &file.to_str().unwrap());
            if temp != 0 {
                errors.push(temp);
            }
        }
    }
    errors
}

#[allow(dead_code)]
fn check_comments_or_nl(line: &String) -> bool {
    let line_arr: Vec<char> = line.chars().collect();
    if line_arr.len() == 0 {
        // Check for newline
        return false;
    }

    if line_arr[0] == '#' {
        // Check for comments
        return false;
    }
    true
}

// Regex reference: http://jkorpela.fi/perl/regexp.html
fn check_question(line: &String, line_num: &u8, fname: &str) -> u8 {
    let line_copy = line.clone();
    let line_parts_iterator = line_copy.split(";");
    let vec: Vec<&str> = line_parts_iterator.collect();

    // Checks that there are atleast 3 ;    error code 1
    if line.chars().filter(|&c| c == ';').count() < 3 {
        return check_regex(
            01,
            "$^".to_string(),
            "Missing \';\' delimiter".to_string(),
            &line,
            &line,
            &line_num,
            &fname,
        );
    }

    let field0: String = vec[0].to_string();
    // Checks that field 0 is either a number or "summary"  error code 2
    let mut temp: u8 = check_regex(
        02,
        "[0-9]+|summary".to_string(),
        "Invalid entry for step number in Field 0.".to_string(),
        &field0,
        &line,
        &line_num,
        &fname,
    );
    // Correct lines have error code 0 (no error)
    if temp != 0 {
        return temp;
    }

    // Checks that field 1 is a number  error code 3
    let field1: String = vec[1].to_string();
    temp = check_regex(
        03,
        "[0-9]+".to_string(),
        "Invalid entry for question index Field 1.".to_string(),
        &field1,
        &line,
        &line_num,
        &fname,
    );
    if temp != 0 {
        return temp;
    }

    let field2: String = vec[2].to_string();
    let f2vec: Vec<&str> = field2.split(":").collect();

    if f2vec.len() > 0 {
        if f2vec[0] == "plain" {
            // Checks that plain has the correct args   error code 4
            temp = check_regex(04, "plain:NA:NA".to_string(), "Invalid entry for question type in Field 2. When question type is specified as [plain], subfields 1 and 2 must be 'NA'. ".to_string(), &field2, &line, &line_num, &fname);
            if temp != 0 {
                return temp;
            }
        } else if f2vec[0] == "waitForPredictionClick" {
            // skip checking for now
        } else {
            // Checks that waitForClick exists   error code 5
            temp = check_regex(
                05,
                "^waitForClick".to_string(),
                "Invalid entry for question type in Field 2. Expected [plain] or [waitForClick]"
                    .to_string(),
                &f2vec[0].to_string(),
                &line,
                &line_num,
                &fname,
            );
            if temp != 0 {
                return temp;
            }
            if f2vec.len() > 2 && !f2vec.contains(&"") {
                // Checks that waitForClick args are seperated by an _, and that there are at most 3.    error code 6
                temp = check_regex(06, "^(gameboard_?|rewardBar_?|saliencyMap_?){0,3}$".to_string(), "Invalid entry for question type in Field 2, subfield 1. Valid entries are {gameboard, rewardBar, saliencyMap}, deliminated by _.".to_string(), &f2vec[1].to_string(), &line, &line_num, &fname);
                if temp != 0 {
                    return temp;
                }

                // Rust regex does not support positive lookahead, so we need to check for repeated entries this way. error code 7
                let wfc_vec: Vec<&str> = f2vec[1].split("_").collect();

                if wfc_vec.iter().filter(|&n| *n == "gameboard").count() > 1
                    || wfc_vec.iter().filter(|&n| *n == "rewardBar").count() > 1
                    || wfc_vec.iter().filter(|&n| *n == "saliencyMap").count() > 1
                {
                    return check_regex(07, "$^".to_string(), "Repeated entries in Field 2, subfield 1. Use options {gameboard, rewardBar, saliencyMap} at most once each.".to_string(), &f2vec[1].to_string(), &line, &line_num, &fname);
                }
            } else {
                // Checks that waitForclick doesn't have blank subfields.   error code 8
                temp = check_regex(08, "$^".to_string(), "Invalid entry for question type in Field 2. Question type [waitForClick] cannot have blank subfields.".to_string(), &field2, &line, &line_num, &fname);
                if temp != 0 {
                    return temp;
                }
            }
        }
    } else {
        temp = check_regex(
            08,
            "$^".to_string(),
            "Invalid entry for question type in Field 2. Expected [plain] or [waitForClick]"
                .to_string(),
            &field2,
            &line,
            &line_num,
            &fname,
        );
        if temp != 0 {
            return temp;
        }
    }

    return 0;
}

/*
check_regex args:
1. error code (0 means no error)
2. regex expression, if string does not pass it then this is an error
3. message explaining what the error is
4. reference to the substring to check
5. the full parent string
6. line number the substring is from
7. the filename the substring is from
*/
fn check_regex(
    error_code: u8,
    regex: String,
    msg: String,
    str_to_check: &String,
    full_line: &String,
    line_num: &u8,
    fname: &str,
) -> u8 {
    let step_reg = Regex::new(&regex).unwrap();
    if !step_reg.is_match(&str_to_check) {
        println!("\nERROR [ID: {}]: {}\n\t--> {}:{}\n\t|\n Line {} | {}\n\t|\n\tInvalid substring: {:?}\n", error_code, msg, fname, line_num, line_num, full_line, str_to_check);
        return error_code;
    }
    0
}

#[test]
fn test_question_checker() {
    let path = PathBuf::from(r"./test_questions.txt");
    //println!("{:?}", check_file(path));
    assert_eq!(check_file(path), [1, 2, 2, 5, 5, 5, 6, 7, 6, 8, 8, 4, 4, 5]);
}
