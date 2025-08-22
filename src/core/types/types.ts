export type Page<T> = {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    items: T[];
}

export enum AppRole {
    USER = 'user',
    ADMIN = 'admin',
}