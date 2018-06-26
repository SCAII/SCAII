extern crate lalrpop_util;
extern crate regex;

use lalrpop_util::ParseError;

use scaii_defs::protos::StudyQuestion;
use std::{error::Error, fmt, fmt::Display, path::Path};

mod grammar {
    pub(super) mod ast {
        /// A parse token with no specific associated value;
        #[derive(Debug, Copy, Clone, PartialEq, Eq)]
        pub struct Token;

        /// A list of question and answer items, with the associated data.
        #[derive(Debug, Clone, PartialEq, Eq)]
        pub struct Qna {
            pub items: Vec<QnaItem>,
        }

        /// The decision step this corresponds to, either a step value
        /// or a "summary" (after all steps).
        #[derive(Debug, Copy, Clone, PartialEq, Eq)]
        pub enum DecisionStep {
            Num(u64),
            Summary,
        }

        impl DecisionStep {
            pub fn to_proto_text(&self) -> String {
                match self {
                    DecisionStep::Num(i) => format!("{}", i),
                    DecisionStep::Summary => "summary".to_string(),
                }
            }
        }

        /// The basic meat of a Q&A item, contains the corresponding
        /// step, its id within the step, and the [`QuestionType`] and
        /// [`QuestionText`].
        ///
        /// [`QuestionType`]: ./QuestionText.t.html
        /// [`QuestionText`]: ./QuestionText.t.html
        #[derive(Debug, Clone, PartialEq, Eq)]
        pub struct QnaItem {
            pub decision_step: DecisionStep,
            pub question_id: u64,

            pub q_type: QuestionType,
            pub q_text: QuestionText,
        }

        /// The text of a Question. If the `radio` value
        /// is set to false, this is a summary question.
        ///
        /// Otherwise, this corresponds to a prompt and a list
        /// of mutually exclusive answers.
        #[derive(Debug, Clone, PartialEq, Eq)]
        pub struct QuestionText {
            pub question: Text,
            pub radio: Option<RadioButtons>,
        }

        impl QuestionText {
            pub fn as_prompt_text(&self) -> &str {
                &self.question.0
            }

            pub fn as_radio_text(&self) -> Vec<&str> {
                match self.radio {
                    None => vec![],
                    Some(ref buttons) => buttons.as_proto_text(),
                }
            }
        }

        /// The text of various radio buttons, should a
        /// question have any.
        #[derive(Debug, Clone, PartialEq, Eq)]
        pub struct RadioButtons {
            pub button_text: Vec<Text>,
        }

        impl RadioButtons {
            pub fn as_proto_text(&self) -> Vec<&str> {
                self.button_text.iter().map(|t| t.0.as_str()).collect()
            }
        }

        /// A basic wrapper over a String, just for
        /// parsing type clarity.
        #[derive(Debug, Clone, PartialEq, Eq)]
        pub struct Text(pub String);

        /// The `QuestionType`. Either `Plain`, in which case
        /// no action from the user is needed, or `WaitForClick`
        /// which contains one or more [`ClickTargets`] the user
        /// may click on to proceed, as well as the prompt text
        /// explaining to the user what they should do.
        ///
        /// [`ClickTargets`]: ./ClickTarget.t.html
        #[derive(Debug, Clone, PartialEq, Eq)]
        pub enum QuestionType {
            WaitForClick(ClickTargets, Text),
            Plain,
        }

        impl QuestionType {
            pub fn to_proto_text(&self) -> String {
                match self {
                    QuestionType::Plain => "plain".to_string(),
                    QuestionType::WaitForClick(targets, text) => {
                        format!("waitForClick:{}:{}", targets.to_proto_text(), text.0)
                    }
                }
            }
        }

        /// The list of valid targets to click on.
        ///
        /// See [`ClickTarget`] for more info.
        ///
        /// [`ClickTarget`]: ./ClickTarget.t.html
        #[derive(Debug, Clone, PartialEq, Eq)]
        pub struct ClickTargets {
            pub targets: Vec<ClickTarget>,
        }

        impl ClickTargets {
            pub fn to_proto_text(&self) -> String {
                let mut targets = self.targets.iter().fold(String::new(), |mut acc, tar| {
                    acc.push_str(tar.as_proto_text());
                    acc.push_str("_");
                    acc
                });

                debug_assert!(targets.len() > 0);
                targets.pop();
                targets
            }
        }

        /// Valid visualization click targets the user must interact with
        /// to proceed.
        #[derive(Debug, Copy, Clone, PartialEq, Eq)]
        pub enum ClickTarget {
            Gameboard,
            SaliencyMap,
            RewardBar,
        }

        impl ClickTarget {
            pub fn as_proto_text(&self) -> &str {
                match self {
                    ClickTarget::Gameboard => "gameboard",
                    ClickTarget::SaliencyMap => "saliencyMap",
                    ClickTarget::RewardBar => "rewardBar",
                }
            }
        }
    }

    include!(concat!(
        env!("OUT_DIR"),
        "/internal/replay/study_util/qna_bnf.rs"
    ));
}

pub use self::grammar::ast::{
    ClickTarget, ClickTargets, DecisionStep, Qna, QnaItem, QuestionText, QuestionType,
    RadioButtons, Text,
};

pub use self::grammar::QnaFileParser;

/// A rudimentary parse error formatter, this essentially is an error facility
/// similar to `rustc`'s which puts a carat (^) under the character where the problem
/// started if `lalrpop` indicated one, as well as indicating the line and column number
/// of the problem instead of the absolute character position.
///
/// This fails sometimes, but is at least occasionally useful.
///
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct QnaParseError {
    line_num: usize,
    col_num: usize,

    line: String,
    context: String,
    description: String,
}

impl QnaParseError {
    /// Attempts to create a new error from an `lalrpop` error.
    pub fn from_parse_error<T: Display, E: Display>(
        text: &str,
        err: &ParseError<usize, T, E>,
    ) -> Option<Self> {
        use std::iter;

        let err_loc = match *err {
            ParseError::InvalidToken { location } => location,
            ParseError::UnrecognizedToken {
                token: Some((location, _, _)),
                ..
            } => location,
            ParseError::ExtraToken {
                token: (location, _, _),
            } => location,
            _ => {
                return None;
            }
        };

        let mut location = 0;
        for (line_num, line) in text.lines().enumerate() {
            if location + line.len() >= err_loc {
                let col_num = err_loc - location;
                let mut context = String::with_capacity(line.len());

                context.extend(iter::repeat(' ').take(col_num));
                context.push('^');

                let description = format!("Parse error: {}", err);

                return Some(QnaParseError {
                    line_num,
                    col_num,

                    line: line.to_string(),
                    context,
                    description,
                });
            }

            location += line.len();
        }

        None
    }
}

impl Error for QnaParseError {
    fn description(&self) -> &str {
        "Q&A File Parse Error"
    }
}

impl Display for QnaParseError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            r#"Cannot parse Q&A file at location line {}:col {}
{}
{}

Cause:
{}
"#,
            self.line_num, self.col_num, self.line, self.context, self.description
        )
    }
}

impl Qna {
    /// Reads and parses a Q&A instance from a `str`.
    pub fn try_from_str(text: &str) -> Result<Self, Box<Error>> {
        use self::grammar::QnaFileParser;

        let err = QnaFileParser::new().parse(text).map_err(|e| {
            QnaParseError::from_parse_error(text, &e).unwrap_or_else(|| panic!("{}", e))
        });

        Ok(err?)
    }

    /// Loads a file and parses it into `Qna` data.
    pub fn try_from_file<P: AsRef<Path>>(path: P) -> Result<Self, Box<Error>> {
        use std::{
            fs::File, io::{BufReader, Read},
        };

        let mut text = String::new();

        let file = File::open(path)?;
        BufReader::new(file).read_to_string(&mut text)?;

        let err = QnaFileParser::new().parse(&text).map_err(|e| {
            QnaParseError::from_parse_error(&text, &e).unwrap_or_else(|| panic!("{}", e))
        });
        Ok(err?)
    }
}

impl From<QnaItem> for StudyQuestion {
    fn from(from: QnaItem) -> Self {
        //         pub struct StudyQuestion {
        //     #[prost(string, required, tag="1")]
        //     pub step: String,
        //     #[prost(string, required, tag="2")]
        //     pub question: String,
        //     #[prost(string, repeated, tag="3")]
        //     pub answers: ::std::vec::Vec<String>,
        //     #[prost(string, required, tag="4")]
        //     pub question_id_for_step: String,
        //     #[prost(string, required, tag="5")]
        //     pub question_type: String,
        // }
        StudyQuestion {
            step: from.decision_step.to_proto_text(),
            question_id_for_step: format!("{}", from.question_id),
            question: from.q_text.as_prompt_text().to_string(),
            answers: from
                .q_text
                .as_radio_text()
                .into_iter()
                .map(|s| s.to_string())
                .collect(),
            question_type: from.q_type.to_proto_text(),
        }
    }
}

impl From<Qna> for Vec<StudyQuestion> {
    fn from(from: Qna) -> Self {
        from.items
            .into_iter()
            .map(|q| StudyQuestion::from(q))
            .collect()
    }
}
