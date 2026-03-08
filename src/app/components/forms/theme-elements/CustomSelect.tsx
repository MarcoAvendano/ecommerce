import React from 'react';
import { styled } from '@mui/material/styles';
import { Select, type SelectProps } from '@mui/material';

const BaseCustomSelect = React.forwardRef<HTMLDivElement, SelectProps>(function BaseCustomSelect(
	props,
	ref,
) {
	return <Select {...props} ref={ref} />;
});

const CustomSelect = styled(BaseCustomSelect)(({}) => ({}));

export default CustomSelect;
