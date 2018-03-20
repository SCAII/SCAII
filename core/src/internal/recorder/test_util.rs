use scaii_defs::protos::{ExplanationPoint, ExplanationPoints, Layer};
use std::error::Error;


pub fn generate_test_saliency_file() -> Result<(), Box<Error>> {
    use super::RecorderError;
    use std::fs::File;
    use std::path::PathBuf;
    use std::io::Write;
    use super::get_default_replay_dir;
    use prost::Message;

    let ep1 = get_test_explanation_point(0, "moveX".to_string(), "moveX details".to_string());
    let ep2 = get_test_explanation_point(5, "moveY".to_string(), "moveY details".to_string());
    let ep3 = get_test_explanation_point(10, "moveZ".to_string(), "moveZ details".to_string());
    let mut vec: Vec<ExplanationPoint> = Vec::new();
    vec.push(ep1);
    vec.push(ep2);
    vec.push(ep3);
    let explanation_points = ExplanationPoints {
        explanation_points: vec,
    };

    let replay_dir : PathBuf = get_default_replay_dir()?;
    let mut saliency_file = replay_dir.clone();
    saliency_file.push("replay.exp".to_string());
    let mut f = File::create(&saliency_file).expect("could not write to saliency file");

    let mut data: Vec<u8> = Vec::new();
    explanation_points.encode(&mut data)?;
    let data_size = data.len();
    let write_result = f.write(&data);
    if write_result.unwrap() != data_size {
        return Err(Box::new(RecorderError::new("could not write test Explanation Points to file.",)));
    }
    Ok(())
}

pub fn get_test_explanation_point(y_shift: u32, name : String, description: String) -> ExplanationPoint {
    let l1: String = "layer1".to_string();
    let l2: String = "layer2".to_string();
    let l3: String = "layer3".to_string();
    let l4: String = "layer4".to_string();
    let l5: String = "layer5".to_string();
    let l6: String = "layer6".to_string();

    let mut layers : Vec<Layer> = Vec::new();
    let y1: u32 = y_shift + 5;
    let y2: u32 = y_shift + 15;
    let y3: u32 = y_shift + 30;
    layers.push(get_layer(l1.clone(),Point{x:5, y:y1},Point{x:5, y:y2},Point{x:5, y:y3},40,40));
    layers.push(get_layer(l2.clone(),Point{x:15, y:y1},Point{x:15, y:y2},Point{x:15, y:y3},40,40));
    layers.push(get_layer(l3.clone(),Point{x:20, y:y1},Point{x:20, y:y2},Point{x:20, y:y3},40,40));
    layers.push(get_layer(l4.clone(),Point{x:25, y:y1},Point{x:25, y:y2},Point{x:25, y:y3},40,40));
    layers.push(get_layer(l5.clone(),Point{x:30, y:y1},Point{x:30, y:y2},Point{x:30, y:y3},40,40));
    layers.push(get_layer(l6.clone(),Point{x:35, y:y1},Point{x:35, y:y2},Point{x:35, y:y3},40,40));
    let ep = get_ep(1,0,name,description,layers);
    ep
}

fn get_ep(step: u32, id: u32, title: String, description: String, layers: Vec<Layer>) -> ExplanationPoint {
    ExplanationPoint {
        step:        Some(step),
        id:          Some(id),
        title:       Some(title),
        description: Some(description),
        saliency:    None,
        bar_chart:   None,
    }
}

struct Point {
    x: u32,
    y: u32,
}


fn get_layer(name : String, point1 : Point, point2: Point, point3: Point, width : u32, height: u32) -> Layer {
    let cells = get_cells_for_points(point1, point2, point3, width, height);
    Layer {
        name: Some(name),
        cells: cells,
        width: Some(width),
        height: Some(height),
    }
}

fn is_match_for_point(point: &Point, x: &u32, y:&u32) -> bool{
    point.x == *x && point.y == *y
}

fn get_cells_for_points(point1: Point, point2: Point, point3: Point, width : u32, height: u32) -> Vec<f64> {
    let mut result : Vec<f64> = Vec::new();
    for x in 0..width {
        for y in 0..height {
            if is_match_for_point(&point1, &x, &y) {
                result.push(1.0);
            }
            else if is_match_for_point(&point2, &x, &y) {
                result.push(0.8);
            }
            else if is_match_for_point(&point3, &x, &y) {
                result.push(0.5)
            }
            else {
                result.push(0.0);
            }
        }
    }
    result
}