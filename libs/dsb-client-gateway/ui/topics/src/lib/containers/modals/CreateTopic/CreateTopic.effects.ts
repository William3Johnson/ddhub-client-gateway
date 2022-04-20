import { useEffect } from 'react';
import { useForm, SubmitHandler, FieldValues } from 'react-hook-form';
import { useRouter } from 'next/router';
import { PostTopicBodyDto } from '@dsb-client-gateway/dsb-client-gateway-api-client';
import { useCreateTopic } from '@dsb-client-gateway/ui/api-hooks';
import { yupResolver } from '@hookform/resolvers/yup';
import { validationSchema, fields } from '../../../models';
import { schemaTypeOptionsByValue } from '../../../utils';
import {
  useTopicsModalsStore,
  useTopicsModalsDispatch,
  TopicsModalsActionsEnum,
} from '../../../context';

export const useCreateTopicEffects = () => {
  const router = useRouter();
  const {
    createTopic: { open, hide, application },
  } = useTopicsModalsStore();
  const dispatch = useTopicsModalsDispatch();

  const initialValues = {
    name: '',
    owner: '',
    schemaType: '',
    schema: '',
    tags: [] as string[],
    version: '',
  };

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { isValid },
    reset,
  } = useForm<FieldValues>({
    defaultValues: initialValues,
    resolver: yupResolver(validationSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    reset({
      owner: router.query['namespace'],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const { createTopicHandler } = useCreateTopic();

  const closeModal = () => {
    dispatch({
      type: TopicsModalsActionsEnum.SHOW_CREATE_TOPIC,
      payload: {
        open: false,
        hide: false,
        application: null,
      },
    });
    reset();
  };

  const hideModal = () => {
    dispatch({
      type: TopicsModalsActionsEnum.HIDE_CREATE_TOPIC,
      payload: true,
    });
  };

  const showModal = () => {
    dispatch({
      type: TopicsModalsActionsEnum.HIDE_CREATE_TOPIC,
      payload: false,
    });
  };

  const topicSubmitHandler: SubmitHandler<FieldValues> = (data) => {
    const values = data as PostTopicBodyDto;
    const fomattedValues = {
      ...values,
      schemaType: schemaTypeOptionsByValue[values.schemaType].label,
    };
    createTopicHandler(fomattedValues as PostTopicBodyDto, closeModal);
  };

  const onSubmit = handleSubmit(topicSubmitHandler);

  const openCancelModal = () => {
    hideModal();
    dispatch({
      type: TopicsModalsActionsEnum.SHOW_CANCEL,
      payload: {
        open: true,
        onConfirm: closeModal,
        onCancel: showModal,
      },
    });
  };

  const schemaTypeValue = watch('schemaType');
  const buttonDisabled = !isValid;

  return {
    open,
    hide,
    closeModal,
    openCancelModal,
    fields,
    register,
    control,
    onSubmit,
    buttonDisabled,
    schemaTypeValue,
    application,
  };
};
