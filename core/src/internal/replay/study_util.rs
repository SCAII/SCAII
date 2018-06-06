
use protos::{StudyQuestion, StudyQuestions, StudyQuestionAnswer};
use std::error::Error;

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
        println!("Looking for question file for replay {}", self.replay_filename);
        let mut questionfile_path = scaii_core::get_default_replay_dir()?;
        let question_filename_root = get_question_filename_root_for_replay(&self.replay_filename);
        println!("question_filename root is {}", question_filename_root);
        let question_filename = get_filename_for_root(question_filename_root)?;
        let mut user_id = "".to_string();
        let mut treatment_id = "".to_string();
        match question_filename  {
            None => { return Ok(None); },
            Some(ref filename)  => {
                user_id = get_field_from_filename(filename, 2 as u32);
                treatment_id = get_field_from_filename(filename, 3 as u32);
                println!("user_id {} ", user_id);
                println!("treatment_id {}", treatment_id);
            },
        }
        questionfile_path.push(question_filename.unwrap().as_str());
        println!("path is {:?}", questionfile_path);
        let f = File::open(questionfile_path)?;
        let reader = BufReader::new(f);

        let mut questions_vec: Vec<StudyQuestion> = Vec::new();
        for line in reader.lines() {
            let question_string = line.unwrap();
            println!("STUDY QUESTION: {}", question_string);
            let question: StudyQuestion = self.get_study_question(&question_string)?;
            questions_vec.push(question);
        }
        let study_questions = StudyQuestions {
            user_id: user_id,
            treatment_id: treatment_id,
            study_questions: questions_vec,
        };
        Ok(Some(study_questions))
    }
    
    fn get_study_question(&mut self, line : &String) -> Result<StudyQuestion, Box<Error>> {
        use super::ReplayError;
        let line_parts_iterator = line.split(";");
        let vec: Vec<&str> = line_parts_iterator.collect();
        if vec.len() < 2 {
            return Err(Box::new(ReplayError::new(&format!("study question line needs at least two fields: <step>;<question>;<answer1>..."))));
        }
        let step: String = vec[0].to_string();
        let question : String = vec[1].to_string();
        let mut answer_vec : Vec<String> = Vec::new();
        for x in 2..vec.len() {
            answer_vec.push(vec[x].to_string());
        }
        Ok(StudyQuestion {
            step: step,
            question: question,
            answers: answer_vec,
        })
    }

    pub fn persist_study_question_answer(&mut self, sqa: StudyQuestionAnswer) -> Result<(), Box<Error>> {
        use std::fs::{File, OpenOptions,remove_file};
        use std::io::Write;
        use scaii_core;
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
            if answerfile_path.exists(){
                remove_file(&answerfile_path)?;
            }
            println!("answerfile_path is {:?}", answerfile_path);
            File::create(&answerfile_path)?;
            let mut file = OpenOptions::new().append(true).open(answerfile_path).unwrap();
            for line in &self.answer_lines {
                file.write_all(line.as_bytes())?;
                file.write_all("\n".to_string().as_bytes())?;
                //writeln!(file, format!("{}",line))?;
            }
        }
        
        Ok(())
    }
}

fn get_field_from_filename(filename : &String, index : u32) -> String {
    let filename_parts_iterator = filename.split(".");
    let vec: Vec<&str> = filename_parts_iterator.collect();
    let root = vec[0];
    let root_parts_iterator = root.split("_");
    let vec:Vec<&str> = root_parts_iterator.collect();
    vec[index as usize].to_string()
}
fn get_filename_for_root(root: String) -> Result<Option<String>, Box<Error>>  {
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

fn get_question_filename_root_for_replay(filename : &String) -> String {
    let filename_parts_iterator = filename.split(".");
    let vec: Vec<&str> = filename_parts_iterator.collect();
    format!("{}_questions", vec[0])
}

// replayX_answers_userID_treatmentID.txt
fn get_answer_filename(filename : &String, user_id: &String, treatment_id: &String) -> String {
    let filename_parts_iterator = filename.split(".");
    let vec: Vec<&str> = filename_parts_iterator.collect();
    format!("{}_answers_{}_{}.txt", vec[0], user_id, treatment_id)
}



