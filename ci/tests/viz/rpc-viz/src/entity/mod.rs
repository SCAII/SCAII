use scaii_defs::protos;
use rand::{Rand, Rng};

use std::error::Error;
use std::ops::{Add, Sub};
use std::collections::HashMap;

#[cfg(test)]
mod test;

mod util;

use self::util::max;

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub struct Color {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub a: u8,
}

impl Color {
    pub fn to_proto(&self) -> protos::Color {
        protos::Color {
            r: self.r as u32,
            g: self.g as u32,
            b: self.b as u32,
            a: self.a as u32,
        }
    }

    pub fn from_proto(color: &protos::Color) -> Result<Self, Box<Error>> {
        Ok(Color {
            r: color.r as u8,
            g: color.g as u8,
            b: color.b as u8,
            a: color.a as u8,
        })
    }
}

impl Add for Color {
    type Output = Self;
    fn add(self, other: Self) -> Self::Output {
        Color {
            r: self.r + other.r,
            g: self.g + other.g,
            b: self.b + other.b,
            a: self.a + other.a,
        }
    }
}

impl Sub for Color {
    type Output = Self;
    fn sub(self, other: Self) -> Self::Output {
        Color {
            r: self.r - other.r,
            g: self.g - other.g,
            b: self.b - other.b,
            a: self.a - other.a,
        }
    }
}

impl Rand for Color {
    fn rand<R: Rng>(rng: &mut R) -> Self {
        use std::u8;
        Color {
            r: rng.gen(),
            g: rng.gen(),
            b: rng.gen(),
            a: rng.gen_range(200, u8::MAX),
        }
    }
}

#[derive(Debug, Copy, Clone, PartialEq)]
pub enum SpecificShape {
    Triangle { base: f64 },
    Rect { width: f64, height: f64 },
}

impl SpecificShape {
    pub fn fuzzy_eq(&self, other: &Self, thresh: f64) -> bool {
        use SpecificShape::*;
        match (self, other) {
            (&Triangle { base: b1 }, &Triangle { base: b2 }) => (b1 - b2).abs() < thresh,
            (
                &Rect {
                    width: w1,
                    height: h1,
                },
                &Rect {
                    width: w2,
                    height: h2,
                },
            ) => (w1 - w2).abs() < thresh && (h1 - h2).abs() < thresh,
            _ => false,
        }
    }
}

#[derive(Debug, Copy, Clone, PartialEq)]
pub struct Shape {
    pub color: Color,
    pub relative_pos: Pos,
    pub shape: SpecificShape,
}

impl Shape {
    pub fn to_proto(&self) -> protos::Shape {
        protos::Shape {
            // in the current implementation of this,
            // entities only have 1 shape
            id: 0,
            color: Some(self.color.to_proto()),
            relative_pos: Some(self.relative_pos.to_proto()),
            rect: if let SpecificShape::Rect {
                ref width,
                ref height,
            } = self.shape
            {
                Some(protos::Rect {
                    width: Some(*width),
                    height: Some(*height),
                })
            } else {
                None
            },
            triangle: if let SpecificShape::Triangle { ref base } = self.shape {
                Some(protos::Triangle {
                    base_len: Some(*base),
                })
            } else {
                None
            },
            delete: false,
        }
    }

    pub fn from_proto(shape: &protos::Shape) -> Result<Self, Box<Error>> {
        if shape.id != 0 {
            Err(format!("Shape's id is not 0. Got: {}", shape.id))?;
        }
        Ok(Shape {
            color: Color::from_proto(
                shape
                    .color
                    .as_ref()
                    .ok_or::<Box<Error>>(From::from("Shape lacks color field"))?,
            )?,
            relative_pos: Pos::from_proto(
                shape
                    .relative_pos
                    .as_ref()
                    .ok_or::<Box<Error>>(From::from("Shape lacks relative_pos field"))?,
            )?,
            shape: {
                if shape.rect.is_some() && shape.triangle.is_some() {
                    Err("Shape has both rect and triangle set")?;
                }

                if let Some(protos::Rect {
                    width: Some(ref width),
                    height: Some(ref height),
                }) = shape.rect
                {
                    SpecificShape::Rect {
                        width: *width,
                        height: *height,
                    }
                } else if let Some(protos::Rect { .. }) = shape.rect {
                    return Err(format!(
                        "Shape has malformed or missing rect fields: {:?}",
                        shape.rect
                    ))?;
                } else if let Some(protos::Triangle {
                    base_len: Some(ref base_len),
                }) = shape.triangle
                {
                    SpecificShape::Triangle { base: *base_len }
                } else if let Some(protos::Triangle { .. }) = shape.triangle {
                    return Err(format!(
                        "Shape has malformed or missing triangle fields: {:?}",
                        shape.triangle
                    ))?;
                } else {
                    return Err(format!(
                        "Shape has malformed or missing rect and triangle fields:\
                         triangle: {:?}; rect: {:?}",
                        shape.triangle,
                        shape.rect
                    ))?;
                }
            },
        })
    }

    pub fn fuzzy_eq(&self, other: &Self, thresh: f64) -> bool {
        self.color == other.color && self.relative_pos.fuzzy_eq(&other.relative_pos, thresh) &&
            self.shape.fuzzy_eq(&other.shape, thresh)
    }
}

impl Rand for Shape {
    fn rand<R: Rng>(rng: &mut R) -> Self {
        Shape {
            color: Color::rand(rng),
            relative_pos: Pos { x: 0.0, y: 0.0 },
            shape: if rng.gen::<bool>() {
                SpecificShape::Triangle {
                    base: rng.gen_range(0.0, 5.0),
                }
            } else {
                SpecificShape::Rect {
                    width: rng.gen_range(0.0, 5.0),
                    height: rng.gen_range(0.0, 5.0),
                }
            },
        }
    }
}

#[derive(Debug, Copy, Clone, PartialEq)]
pub struct Pos {
    pub x: f64,
    pub y: f64,
}

impl Pos {
    pub fn to_proto(&self) -> protos::Pos {
        protos::Pos {
            x: Some(self.x),
            y: Some(self.y),
        }
    }

    pub fn from_proto(pos: &protos::Pos) -> Result<Self, Box<Error>> {
        Ok(Pos {
            x: pos.x
                .ok_or::<Box<Error>>(From::from("Position lacks x field"))?,
            y: pos.y
                .ok_or::<Box<Error>>(From::from("Position lacks y field"))?,
        })
    }

    pub fn fuzzy_eq(&self, other: &Self, thresh: f64) -> bool {
        (self.x - other.x).abs() < thresh && (self.y - other.y).abs() < thresh
    }
}

impl Rand for Pos {
    fn rand<R: Rng>(rng: &mut R) -> Self {
        Pos {
            x: rng.gen_range(0.0, 100.0),
            y: rng.gen_range(0.0, 100.0),
        }
    }
}

#[derive(Debug, Copy, Clone, PartialEq)]
pub struct Entity {
    pub pos: Pos,
    pub shape: Shape,
}

impl Entity {
    pub fn fuzzy_eq(&self, other: &Self, thresh: f64) -> bool {
        self.pos.fuzzy_eq(&other.pos, thresh) && self.shape.fuzzy_eq(&other.shape, thresh)
    }
}

impl Rand for Entity {
    fn rand<R: Rng>(rng: &mut R) -> Self {
        Entity {
            pos: Pos::rand(rng),
            shape: Shape::rand(rng),
        }
    }
}

#[derive(Debug, Copy, Clone, PartialEq)]
pub struct IdEntity {
    pub entity: Entity,
    pub id: usize,
}

impl IdEntity {
    pub fn rand_new<R: Rng>(id: usize, rng: &mut R) -> Self {
        IdEntity {
            entity: rng.gen(),
            id: id,
        }
    }

    pub fn to_proto(&self) -> protos::Entity {
        protos::Entity {
            id: self.id as u64,
            pos: Some(self.entity.pos.to_proto()),
            shapes: vec![self.entity.shape.to_proto()],
            delete: false,
        }
    }

    pub fn from_proto(entity: &protos::Entity) -> Result<Self, Box<Error>> {
        Ok(IdEntity {
            id: entity.id as usize,
            entity: Entity {
                pos: Pos::from_proto(
                    entity
                        .pos
                        .as_ref()
                        .ok_or::<Box<Error>>(From::from("Entity lacks pos field"))?,
                )?,
                shape: {
                    if entity.shapes.len() != 1 {
                        Err("Entity's shape field is not exactly 1")?;
                    }
                    Shape::from_proto(&entity.shapes[0])?
                },
            },
        })
    }

    pub fn fuzzy_eq(&self, other: &Self, thresh: f64) -> bool {
        self.id == other.id && self.entity.fuzzy_eq(&other.entity, thresh)
    }

    pub fn create_update<R: Rng>(&self, rng: &mut R) -> EntityUpdate {
        use EntityUpdate::*;

        let weights = vec![80, 2, 2, 10, 2, 4];
        let mut options = vec![
            match rng.gen_range(0, 3) {
                0 => Move {
                    x: Some(rng.gen_range(1.0, 4.0)),
                    y: Some(rng.gen_range(1.0, 4.0)),
                    subtract: rng.gen(),
                },
                1 => Move {
                    x: Some(rng.gen_range(1.0, 4.0)),
                    y: None,
                    subtract: rng.gen(),
                },
                2 => Move {
                    x: None,
                    y: Some(rng.gen_range(1.0, 4.0)),
                    subtract: rng.gen(),
                },
                _ => unreachable!(),
            },
            Delete,
            Create,
            ChangeShapeColor(
                Color {
                    r: rng.gen_range(0, 10),
                    g: rng.gen_range(0, 10),
                    b: rng.gen_range(0, 10),
                    a: rng.gen_range(0, 3),
                },
                rng.gen(),
            ),
            ChangeShape(rng.gen::<Shape>().shape),
            match self.entity.shape.shape {
                SpecificShape::Rect { .. } => match rng.gen_range(0, 3) {
                    0 => AlterRect {
                        width: Some(rng.gen_range(1.0, 4.0)),
                        height: Some(rng.gen_range(1.0, 4.0)),
                        subtract: rng.gen(),
                    },
                    1 => AlterRect {
                        width: Some(rng.gen_range(1.0, 4.0)),
                        height: None,
                        subtract: rng.gen(),
                    },
                    2 => AlterRect {
                        width: None,
                        height: Some(rng.gen_range(1.0, 4.0)),
                        subtract: rng.gen(),
                    },
                    _ => unreachable!(),
                },
                SpecificShape::Triangle { .. } => AlterTriangle {
                    base: rng.gen_range(1.0, 4.0),
                    subtract: rng.gen(),
                },
            },
        ];

        let upper = weights.iter().sum();
        let choice = rng.gen_range(0, upper);
        let mut acc = 0;
        for (i, weight) in weights.into_iter().enumerate() {
            acc += weight;
            if acc >= choice {
                return options.swap_remove(i);
            }
        }

        unreachable!("Weighted choice shouldn't get here");
    }
}

pub enum EntityUpdate {
    Move {
        x: Option<f64>,
        y: Option<f64>,
        subtract: bool,
    },
    Delete,
    Create,
    ChangeShapeColor(Color, bool),
    ChangeShape(SpecificShape),
    AlterRect {
        width: Option<f64>,
        height: Option<f64>,
        subtract: bool,
    },
    AlterTriangle { base: f64, subtract: bool },
}

impl EntityUpdate {
    pub fn apply_and_make_proto<R: Rng>(
        entities: &mut HashMap<usize, IdEntity>,
        key: usize,
        rng: &mut R,
    ) -> protos::Entity {
        use EntityUpdate::*;
        let update = entities.get(&key).unwrap().create_update(rng);

        match update {
            Delete => {
                entities.remove(&key);
                protos::Entity {
                    id: key as u64,
                    pos: None,
                    shapes: Vec::new(),
                    delete: true,
                }
            }
            Create => {
                let next_id = entities.keys().max().unwrap() + 1;
                let new_entity = IdEntity::rand_new(next_id, rng);
                let proto = new_entity.to_proto();
                entities.insert(next_id, new_entity);
                proto
            }
            Move { x, y, subtract } => {
                let entity = entities.get_mut(&key).unwrap();
                let pos = &mut entity.entity.pos;
                let proto = protos::Entity {
                    id: key as u64,
                    delete: false,
                    pos: Some(protos::Pos {
                        x: x.and_then(|x| Some(if subtract { pos.x - x } else { pos.x + x })),
                        y: y.and_then(|y| Some(if subtract { pos.y - y } else { pos.y + y })),
                    }),
                    shapes: Vec::new(),
                };
                if subtract {
                    pos.x = x.map(|x| pos.x - x).unwrap_or(pos.x);
                    pos.y = y.map(|y| pos.y - y).unwrap_or(pos.y);
                } else {
                    pos.x = x.map(|x| pos.x + x).unwrap_or(pos.x);
                    pos.y = y.map(|y| pos.y + y).unwrap_or(pos.y);
                }
                proto
            }
            ChangeShapeColor(color, subtract) => {
                let entity = entities.get_mut(&key).unwrap();
                let shape = &mut entity.entity.shape;
                shape.color = if subtract {
                    shape.color - color
                } else {
                    shape.color + color
                };
                let shape_proto = protos::Shape {
                    id: 0,
                    relative_pos: None,
                    color: Some(shape.color.to_proto()),
                    rect: None,
                    triangle: None,
                    delete: false,
                };
                protos::Entity {
                    id: key as u64,
                    delete: false,
                    pos: None,
                    shapes: vec![shape_proto],
                }
            }
            ChangeShape(specific_shape) => {
                let entity = entities.get_mut(&key).unwrap();
                entity.entity.shape.shape = specific_shape;
                let shape_proto = protos::Shape {
                    id: 0,
                    relative_pos: None,
                    color: None,
                    rect: if let SpecificShape::Rect { width, height } = specific_shape {
                        Some(protos::Rect {
                            width: Some(width),
                            height: Some(height),
                        })
                    } else {
                        None
                    },
                    triangle: if let SpecificShape::Triangle { base } = specific_shape {
                        Some(protos::Triangle {
                            base_len: Some(base),
                        })
                    } else {
                        None
                    },
                    delete: false,
                };

                protos::Entity {
                    id: key as u64,
                    delete: false,
                    pos: None,
                    shapes: vec![shape_proto],
                }
            }
            AlterRect {
                width,
                height,
                subtract,
            } => {
                let entity = entities.get_mut(&key).unwrap();
                let (e_width, e_height) = if let SpecificShape::Rect {
                    ref mut width,
                    ref mut height,
                } = entity.entity.shape.shape
                {
                    (width, height)
                } else {
                    unreachable!("This is verified when creating the update");
                };
                let rect_proto = protos::Rect {
                    width: width.and_then(|width| {
                        Some(if subtract {
                            max(*e_width - width,0.1)
                        } else {
                            *e_width + width
                        })
                    }),
                    height: height.and_then(|height| {
                        Some(if subtract {
                            max(*e_height - height,0.1)
                        } else {
                            *e_height + height
                        })
                    }),
                };
                let shape_proto = protos::Shape {
                    id: 0,
                    delete: false,
                    rect: Some(rect_proto),
                    triangle: None,
                    color: None,
                    relative_pos: None,
                };

                if subtract {
                    *e_width = width.map(|width| max(*e_width - width,0.1)).unwrap_or(*e_width);
                    *e_height = height.map(|height| max(*e_width - height,0.1)).unwrap_or(*e_height);
                } else {
                    *e_width = width.map(|width| *e_width + width).unwrap_or(*e_width);
                    *e_height = height.map(|height| *e_width + height).unwrap_or(*e_height);
                }

                protos::Entity {
                    id: key as u64,
                    delete: false,
                    pos: None,
                    shapes: vec![shape_proto],
                }
            }
            AlterTriangle { base, subtract } => {
                let entity = entities.get_mut(&key).unwrap();
                let e_base =
                    if let SpecificShape::Triangle { ref mut base } = entity.entity.shape.shape {
                        base
                    } else {
                        unreachable!("This is verified when creating the update");
                    };
                let triangle_proto = protos::Triangle {
                    base_len: Some(if subtract {
                        max(*e_base - base,0.1)
                    } else {
                        *e_base + base
                    }),
                };
                let shape_proto = protos::Shape {
                    id: 0,
                    delete: false,
                    rect: None,
                    triangle: Some(triangle_proto),
                    color: None,
                    relative_pos: None,
                };

                if subtract {
                    *e_base = max(*e_base-base, 0.1);
                } else {
                    *e_base += base;
                }

                protos::Entity {
                    id: key as u64,
                    delete: false,
                    pos: None,
                    shapes: vec![shape_proto],
                }
            }
        }
    }
}

pub fn gen_entities<R: Rng>(rng: &mut R) -> Vec<IdEntity> {
    let num_entities = rng.gen_range(8, 12);
    let mut out = Vec::with_capacity(num_entities);
    for i in 0..num_entities {
        out.push(IdEntity::rand_new(i, rng));
    }

    out
}
