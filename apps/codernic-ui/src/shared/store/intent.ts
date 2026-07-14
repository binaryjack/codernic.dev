import { createAction } from '@reduxjs/toolkit';

export const sendIntent = createAction<{ type: string; payload?: any }>('system/sendIntent');
