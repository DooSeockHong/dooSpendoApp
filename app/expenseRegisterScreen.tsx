import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

// 1. API로 전송할 데이터 객체 타입 정의
type SpendoData = {
  spendoTitle: string;
  spendoContent: string;
  spendoPrice: number;
  spendoType: string;
  spendoCodeType: string;
  spendoDate: string;
};

// 2. GET 요청으로 받아올 공통 코드 객체 타입 정의
type CommonCodeType = {
  commonNo: number;
  commonCode: string;
  commonName: string;
};

// 3. API 응답의 전체 구조를 위한 타입 정의
// 실제 데이터가 "data" 키 안에 배열로 들어있을 경우를 고려하여 구조를 정확히 명시합니다.
type ApiResponse<T> = {
  data: T;
  msg: string;
  status: string;
};

// =========================================================================
// !!! 중요 !!!
// 아래 baseURL을 사용자 컴퓨터의 실제 로컬 IP 주소로 변경해야 합니다.
// =========================================================================
const api = axios.create({
  baseURL: 'http://127.0.0.0:8080/api', // <-- 이 부분을 수정하세요!
  headers: {
    'Content-Type': 'application/json',
  },
});

// POST 요청 함수
const postExpense = async (data: SpendoData) => {
  try {
    const response = await api.post('/spendo/spendoAdd', data); 
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('POST 요청 실패 (응답 코드:', error.response.status, '):', error.response.data);
    } else {
      console.error('POST 요청 실패:', error);
    }
    throw error;
  }
};

// GET 요청 함수
const getCommonCodes = async (): Promise<CommonCodeType[]> => {
  try {
    // ApiResponse 타입을 사용하여 API 응답의 전체 구조를 정확하게 정의
    const response = await api.get<ApiResponse<CommonCodeType[]>>('/common/commonExInCodeGet');
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('공통 코드 GET 요청 실패 (응답 코드:', error.response.status, '):', error.response.data);
    } else {
      console.error('공통 코드 GET 요청 실패:', error);
    }
    throw error;
  }
};

export default function ExpenseRgisterScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 공통 코드를 동적으로 관리하기 위한 상태 추가
  const [selectedType, setType] = useState(''); 
  const [commonCodes, setCommonCodes] = useState<CommonCodeType[]>([]);
  const [isLoadingCodes, setIsLoadingCodes] = useState(true);

  // 컴포넌트가 처음 마운트될 때 공통 코드 데이터를 가져오는 useEffect
  useEffect(() => {
    const fetchCommonCodes = async () => {
      try {
        const codes = await getCommonCodes();
        setCommonCodes(codes);
        if (codes.length > 0) {
          // 가져온 데이터에서 첫 번째 코드를 기본값으로 설정
          setType(codes[0].commonCode);
        }
      } catch (error) {
        Alert.alert('오류', '지출/수입 코드를 가져오는 데 실패했습니다.');
      } finally {
        setIsLoadingCodes(false);
      }
    };
    fetchCommonCodes();
  }, []);

  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleReset = () => {
    setTitle('');
    setContent('');
    setPrice('');
    setDate(new Date());
    // 공통 코드가 로드된 경우 첫 번째 코드로 초기화
    if (commonCodes.length > 0) {
      setType(commonCodes[0].commonCode);
    } else {
      setType('');
    }
  };

  const handleRegister = async () => {
    // 유효성 검사
    if (!title.trim()) {
      Alert.alert('입력 오류', '제목을 입력하세요.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('입력 오류', '내용을 입력하세요.');
      return;
    }
    const parsedPrice = parseInt(price, 10);
    if (!price.trim() || isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('입력 오류', '올바른 가격(양수)을 입력하세요.');
      return;
    }
    if (!selectedType) {
      Alert.alert('오류', '지출/수입 유형을 선택하세요.');
      return;
    }

    // 선택된 항목의 commonName을 찾습니다.
    const selectedCommonCode = commonCodes.find(code => code.commonCode === selectedType);

    // SpendoData 타입에 맞게 데이터 객체 생성
    const data: SpendoData = {
      spendoTitle: title,
      spendoContent: content,
      spendoPrice: parsedPrice,
      // API에서 받은 commonName 값으로 동적으로 변경
      spendoType: selectedCommonCode ? selectedCommonCode.commonCode : '',
      // API에서 받은 commonCode 값으로 동적으로 변경
      spendoCodeType: "CC01",
      spendoDate: formatDate(date),
    };

    try {
      await postExpense(data);
      Alert.alert('등록 완료', '등록이 완료되었습니다.', [{ text: '확인' }]);
      handleReset();
    } catch (error) {
      Alert.alert('오류', '등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
          
          {/* 날짜 */}
          <Text style={styles.label}>날짜</Text>
          <View style={styles.dateRow}>
            <Text style={styles.dateText}>{formatDate(date)}</Text>
            <Button title="날짜 선택" onPress={() => setShowDatePicker(true)} />
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDate(selectedDate);
                }
              }}
            />
          )}

          {/* 제목 */}
          <Text style={[styles.label, { marginTop: 30 }]}>제목</Text>
          <TextInput
            style={styles.input}
            placeholder="제목을 입력하세요"
            value={title}
            onChangeText={setTitle}
          />

          {/* 내용 */}
          <Text style={[styles.label, { marginTop: 30 }]}>내용</Text>
          <TextInput
            style={styles.textArea}
            placeholder="내용을 입력하세요"
            value={content}
            onChangeText={setContent}
            multiline={true}
            textAlignVertical="top"
          />

          {/* 가격 */}
          <Text style={[styles.label, { marginTop: 30 }]}>가격</Text>
          <TextInput
            style={styles.input}
            placeholder="가격을 입력하세요"
            value={price}
            onChangeText={(text) => {
              const filtered = text.replace(/[^0-9]/g, '');
              setPrice(filtered);
            }}
            keyboardType="numeric"
          />

          {/* 지출/수입 */}
          <Text style={[styles.label, { marginTop: 30 }]}>지출/수입</Text>
          <View style={styles.pickerWrapper}>
            {isLoadingCodes ? (
              <ActivityIndicator size="large" color="#0000ff" style={{ marginVertical: 10 }} />
            ) : (
              commonCodes.length > 0 ? (
                <Picker
                  selectedValue={selectedType}
                  onValueChange={(itemValue) => setType(itemValue)}
                  style={styles.picker}
                >
                  {commonCodes.map((code) => (
                    code && (
                      <Picker.Item
                        key={String(code.commonCode)} 
                        label={String(code.commonName)} 
                        value={String(code.commonCode)}
                      />
                    )
                  ))}
                </Picker>
              ) : (
                <Text style={{ padding: 12 }}>코드를 불러오지 못했습니다.</Text>
              )
            )}
          </View>

          {/* 버튼 영역 */}
          <View style={styles.buttonRow}>
            <View style={styles.buttonWrapper}>
              <Button title="등록" onPress={handleRegister} color="#4CAF50" />
            </View>
            <View style={styles.buttonWrapper}>
              <Button title="취소" onPress={handleReset} color="#f44336" />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 24,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 18,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 18,
    height: 150,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6,
    padding: 12,
  },
  dateText: {
    fontSize: 18,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    gap: 12,
  },
  buttonWrapper: {
    flex: 1,
  },
});
