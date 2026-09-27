'use client';

import React from 'react';
import MyRoutinesModal, { MyRoutinesModalProps } from './MyRoutinesModal';

export type ExerciseLibraryModalProps = MyRoutinesModalProps;

export default function ExerciseLibraryModal(props: ExerciseLibraryModalProps) {
  return <MyRoutinesModal {...props} />;
}
