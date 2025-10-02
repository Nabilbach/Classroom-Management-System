import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  /*
    Thin re-export wrapper.
    The implementation lives in `src/components/AbsenceHistoryContent.tsx` which is the
    canonical source-of-truth for this feature. This file intentionally re-exports the
    canonical component so feature-scoped copies don't diverge and risk exposing
    inconsistent behavior or data handling.
  */

  export { default } from '../../../components/AbsenceHistoryContent';