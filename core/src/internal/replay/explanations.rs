use super::protos::{Action, ExplanationPoint,ExplanationPoints};
use scaii_core::{ActionWrapper,ReplayAction};
use std::path::PathBuf;
use std::collections::BTreeMap;
use std::error::Error;
use super::ReplayError;
use prost::Message;

pub struct Explanations {
    pub step_indices: Vec<u32>,
    pub expl_map:  BTreeMap<u32, ExplanationPoint>,
}

pub fn is_empty(explanations_option : &Option<Explanations>) -> bool {
    match explanations_option {
        &None => {
            println!("is_empty()? FOUND NONE");
            true
        }
        &Some(ref explanations) => {
            println!("is_empty()? FOUND SOME:{}", explanations.step_indices.len());
            explanations.step_indices.len() == 0
        }
    }
}
pub fn map_explanations(explanation_points: Vec<ExplanationPoint>) -> Result<Option<Explanations>, Box<Error>> {
    println!("MAPPING EXPL POINTS recieved this many {}", explanation_points.len());
    let mut step_indices : Vec<u32> = Vec::new();
    let mut expl_map: BTreeMap<u32, ExplanationPoint> = BTreeMap::new();
    for expl_point in explanation_points {
        let step = expl_point.step.unwrap();
        step_indices.push(step.clone());
        expl_map.insert(step,expl_point.clone());
    }
    Ok(Some(Explanations {
        step_indices: step_indices,
        expl_map: expl_map,
    }))
}

pub fn extract_explanations(replay_actions: Vec<ReplayAction>, r_actions_sans_explanations: &mut Vec<ReplayAction>) -> Result<Vec<ExplanationPoint>, Box<Error>> {
    let mut explanation_points: Vec<ExplanationPoint> = Vec::new();
    for replay_action in replay_actions {
        match replay_action {
            ReplayAction::Delta(action_wrapper) => {
                let new_action_wrapper = extract_explanation_from_action_wrapper(action_wrapper, &mut explanation_points)?;
                let new_replay_action = ReplayAction::Delta(new_action_wrapper);
                r_actions_sans_explanations.push(new_replay_action);
            }
            ReplayAction::Keyframe(ser_info, action_wrapper) => {
                let new_action_wrapper = extract_explanation_from_action_wrapper(action_wrapper, &mut explanation_points)?;
                let new_replay_action = ReplayAction::Keyframe(ser_info, new_action_wrapper);
                r_actions_sans_explanations.push(new_replay_action);
            }
            ReplayAction::Header(_) => {
                r_actions_sans_explanations.push(replay_action);
            },
        }
    }
    Ok(explanation_points)
}

fn get_serialized_action(action: &Action) -> Result<Vec<u8>, Box<Error>> {
    let mut action_data: Vec<u8> = Vec::new();
    action.encode(&mut action_data)?;
    Ok(action_data)
}

fn extract_explanation_from_action_wrapper(action_wrapper : ActionWrapper, explanation_points : &mut Vec<ExplanationPoint>) -> Result<ActionWrapper, Box<Error>> {
    let data = action_wrapper.serialized_action;
    let action_decode_result = Action::decode(data);
    match action_decode_result {
        Ok(action) =>  {
            match action.explanation_point {
                None => {
                    println!("Explanation?  None");
                },
                Some(explanation_point) => {
                    println!("Explanation?  YES");
                    explanation_points.push(explanation_point);
                },
            }
            // make new Action without Explanation
            let new_action = Action{
                discrete_actions : action.discrete_actions,
                continuous_actions : action.continuous_actions,
                alternate_actions : action.alternate_actions,
                explanation_point : Option::None,
            };
            let mut new_action_data: Vec<u8> = Vec::new();
            new_action.encode(&mut new_action_data)?;
            Ok(ActionWrapper {
                has_explanation: false,
                step: action_wrapper.step,
                title: action_wrapper.title,
                serialized_action: new_action_data,
            })
        }
        Err(err) => {
            Err(Box::new(ReplayError::new("could not decode ActionWrapper during explanation stripping")))
        }
    }
}

pub fn get_explanations_for_replay_file(mut path: PathBuf) -> Result<Option<Explanations>, Box<Error>> {
    let path_clone = path.clone();
    let filestem_option = path_clone.file_stem();
    match filestem_option {
        Some(os_stem_string) => {
            println!("os_stem_string is {:?}", os_stem_string);
            let filestem: String = os_stem_string.to_str().unwrap().to_string();
            let explanation_filename = format!("{}.exp", filestem);
            path.pop(); // parent dir
            path.push(explanation_filename);
            println!("explanation filepath is {:?}", path);
            get_explanations_for_explanations_file(path)
        },
        None => Ok(None)
    }
}

pub fn get_explanations_for_explanations_file(path: PathBuf) -> Result<Option<Explanations>, Box<Error>> {
    use std::fs::File;
    use std::io::BufReader;
    use std::io::Read;
    use super::prost::Message;

    if !path.as_path().exists() {
        return Ok(None);
    }
    let replay_file = File::open(path.clone()).expect("file not found");
    let mut bytes : Vec<u8> = Vec::new();
    let mut reader = BufReader::new(replay_file);
    let read_result = reader.read_to_end(&mut bytes);
    match read_result {
        Ok(read_usize) => {
            println!("read this many bytes {:?}", read_usize);
            let explanation_points =
                ExplanationPoints::decode(bytes)?;
           // assert!(explanation_points.explanation_points.len() == 3);
            println!("explanation point count {}", explanation_points.explanation_points.len());
            let explanations_option = get_explanations_for_explanation_points(explanation_points)?;
            Ok(explanations_option)
        },
        Err(err) => {
            return Err(Box::new(ReplayError::new(&format!("ERROR - failed to read explanations file {:?}", path))));
        },
    }
}

fn get_explanations_for_explanation_points(expl_points : ExplanationPoints) -> Result<Option<Explanations>, Box<Error>> {
    let mut step_indices : Vec<u32> = Vec::new();
    let mut expl_map: BTreeMap<u32, ExplanationPoint> = BTreeMap::new();
    for expl_point in expl_points.explanation_points{
        let step = expl_point.step.unwrap();
        step_indices.push(step.clone());
        expl_map.insert(step,expl_point.clone());
    }
    Ok(Some(Explanations {
        step_indices: step_indices,
        expl_map: expl_map,
    }))
}