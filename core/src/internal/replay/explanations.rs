use super::protos::{ExplanationPoint,ExplanationPoints};
use std::path::PathBuf;
use std::collections::BTreeMap;
use std::error::Error;

pub struct Explanations {
    pub step_indices: Vec<u32>,
    pub expl_map:  BTreeMap<u32, ExplanationPoint>,
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
    use super::ReplayError;
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
            assert!(explanation_points.explanation_points.len() == 3);
            println!("explanation poitn count {}", explanation_points.explanation_points.len());
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