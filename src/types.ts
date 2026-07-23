export interface Form {
  formId: string;
  info: Info;
  settings?: FormSettings;
  items: Item[];
  revisionId?: string;
  responderUri?: string;
}

export interface Info {
  title: string;
  description?: string;
  documentTitle?: string;
}

export interface FormSettings {
  quizSettings?: QuizSettings;
}

export interface QuizSettings {
  isQuiz: boolean;
}

export interface Item {
  itemId: string;
  title?: string;
  description?: string;
  questionItem?: QuestionItem;
  questionGroupItem?: QuestionGroupItem;
  pageBreakItem?: PageBreakItem;
  textItem?: TextItem;
  imageItem?: ImageItem;
  videoItem?: VideoItem;
}

export interface QuestionItem {
  question: Question;
  image?: Image;
}

export interface Question {
  questionId: string;
  required?: boolean;
  grading?: Grading;
  choiceQuestion?: ChoiceQuestion;
  textQuestion?: TextQuestion;
  scaleQuestion?: ScaleQuestion;
  dateQuestion?: DateQuestion;
  timeQuestion?: TimeQuestion;
  fileUploadQuestion?: FileUploadQuestion;
  rowQuestion?: RowQuestion;
}

export interface ChoiceQuestion {
  type: 'CHOICE_TYPE_UNSPECIFIED' | 'RADIO' | 'CHECKBOX' | 'DROP_DOWN';
  options: Option[];
  shuffle?: boolean;
}

export interface Option {
  value: string;
  image?: Image;
  isOther?: boolean;
  goToAction?: 'GO_TO_ACTION_UNSPECIFIED' | 'NEXT_SECTION' | 'RESTART_FORM' | 'SUBMIT_FORM';
  goToSectionId?: string;
}

export interface TextQuestion {
  paragraph?: boolean;
}

export interface PageBreakItem {}

export interface TextItem {}

export interface ImageItem {
  image: Image;
}

export interface Image {
  contentUri: string;
  altText?: string;
  properties?: ImageProperties;
}

export interface ImageProperties {
  alignment?: 'ALIGNMENT_UNSPECIFIED' | 'LEFT' | 'RIGHT' | 'CENTER';
  width?: number;
}

export interface VideoItem {
  video: Video;
  caption?: string;
}

export interface Video {
  youtubeUri: string;
  properties?: VideoProperties;
}

export interface VideoProperties {
  alignment?: 'ALIGNMENT_UNSPECIFIED' | 'LEFT' | 'RIGHT' | 'CENTER';
  width?: number;
}

export interface QuestionGroupItem {
  questions: Question[];
  image?: Image;
}

export interface Grading {
  pointValue: number;
  whenRight: CorrectnessFeedback;
  whenWrong: CorrectnessFeedback;
  generalFeedback: CorrectnessFeedback;
}

export interface CorrectnessFeedback {
  text: string;
}

export interface ScaleQuestion {
  low: number;
  high: number;
  lowLabel?: string;
  highLabel?: string;
}

export interface DateQuestion {
  includeTime?: boolean;
  includeYear?: boolean;
}

export interface TimeQuestion {
  duration?: boolean;
}

export interface FileUploadQuestion {
  endpoint: string;
  types: string[];
  maxFiles: number;
  maxFileSize: number;
}

export interface RowQuestion {
  title: string;
}
