export type TUEssay = {
    title: string,
    url: string,
    date: string;
    content: string;
    tokens: number;
    chunks: TUChunk[]

};

export type TUChunk = {
    essay_title: string;
    essay_url: string;
    essay_date: string;
    content: string;
    content_tokens: number;
    embedding: number[]
     
};

export type TUJSON = {
    tokens: number;
    essays: TUEssay[];
};
