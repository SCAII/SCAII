
use protos::{StudyQuestion, StudyQuestions};
use std::error::Error;

pub fn get_questions_for_replay(filename : &String) -> Result<Option<StudyQuestions>, Box<Error>> {
    use scaii_core;
    use std::fs::File;
    use std::io::prelude::*;
    use std::io::BufReader;
    println!("Looking for question fiel for replay {}", filename);
    let mut questionfile_path = scaii_core::get_default_replay_dir()?;
    let question_filename = get_question_filename_for_replay(&filename);
    println!("question_filename is {}", question_filename);
    questionfile_path.push(question_filename.as_str());
    println!("path is {:?}", questionfile_path);

    let f = File::open(questionfile_path)?;
    let reader = BufReader::new(f);

    let mut questions_vec: Vec<StudyQuestion> = Vec::new();
    for line in reader.lines() {
        let question_string = line.unwrap();
        println!("STUDY QUESTION: {}", question_string);
        let question: StudyQuestion = get_study_question(&question_string)?;
        questions_vec.push(question);
    }
    let study_questions = StudyQuestions {
        study_questions: questions_vec,
    };
    Ok(Some(study_questions))
}

fn get_question_filename_for_replay(filename : &String) -> String {
    let filename_parts_iterator = filename.split(".");
    let vec: Vec<&str> = filename_parts_iterator.collect();
    format!("{}_questions.txt", vec[0])
}

fn get_study_question(line : &String) -> Result<StudyQuestion, Box<Error>> {
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

// message StudyQuestions {
//     repeated StudyQuestion study_questions = 1;
// }

// message StudyQuestion {
//     required uint32 step = 1;
//     required string question = 2;
//     repeated string answers = 3;
// }
