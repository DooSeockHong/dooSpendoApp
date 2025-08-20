import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import RadioGroup from 'react-native-radio-buttons-group';

// Axios API 클라이언트 설정
const api = axios.create({
  baseURL: 'http://127.0.0.0:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 공통 코드 타입 정의
type CommonCodeType = {
  commonNo: number;
  commonCode: string;
  commonName: string;
};

// API 응답 타입 정의
type ApiResponse<T> = {
  data: T;
  msg: string;
  status: string;
};

// 검색 조건 타입 정의
type SpendoListData = {
  startDt: string;
  endDt: string;
  spendoTitle?: string;
  spendoType?: string;
  spendoCodeType?: string;
};

// 가계부 항목 타입 정의
type SpendoItemType = {
  spendoNo: number;
  spendoDate: string;
  spendoTitle: string;
  spendoPrice: number;
  spendoContent: string;
  spendoType: string;
  spendoCodeType: string;
};

// 가계부 수정 DTO 타입 정의 추가
type SpendoEditDTO = {
  spendoNo: number;
  spendoDate: string;
  spendoTitle: string;
  spendoPrice: number;
  spendoContent: string;
  spendoType: string;
  spendoCodeType: string;
};

// 지출/수입 공통 코드 API 호출 함수
export const getCommonCodes = async (): Promise<CommonCodeType[]> => {
  try {
    const response = await api.get<ApiResponse<CommonCodeType[]>>('/common/commonExInCodeGet');
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('지출/수입 공통 코드 조회 실패 (응답 코드:', error.response.status, '):', error.response.data);
    } else {
      console.error('지출/수입 공통 코드 조회 실패:', error);
    }
    throw error;
  }
};

// 카드 종류 공통 코드 API 호출 함수
export const getCommonCardTypeCodes = async (): Promise<CommonCodeType[]> => {
  try {
    const response = await api.get<ApiResponse<CommonCodeType[]>>('/common/commonCcCrCodeGet');
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('카드 종류 공통 코드 조회 실패 (응답 코드:', error.response.status, '):', error.response.data);
    } else {
      console.error('카드 종류 공통 코드 조회 실패:', error);
    }
    throw error;
  }
};

// 거래 내역 조회 API 통신
export const getSpendoListByDate = async (data: SpendoListData): Promise<SpendoItemType[]> => {
  try {
    const response = await api.get<ApiResponse<SpendoItemType[]>>('/spendo/spendoList', {
      params: data,
    });
    console.log(response.data.data);
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('가계부 내역 조회 실패 (응답 코드:', error.response.status, '):', error.response.data);
    } else {
      console.error('가계부 내역 조회 실패:', error);
    }
    throw error;
  }
};

// 가계부 상세 정보 조회 API 통신
export const getSpendoDetails = async (spendoNo: number): Promise<SpendoItemType> => {
  try {
    const response = await api.get<ApiResponse<SpendoItemType>>('/spendo/spendoDetails', {
      params: { spendoNo },
    });
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('가계부 상세 정보 조회 실패 (응답 코드:', error.response.status, '):', error.response.data);
    } else {
      console.error('가계부 상세 정보 조회 실패:', error);
    }
    throw error;
  }
};

// 가계부 항목 수정 API 통신 추가
export const updateSpendoItem = async (spendoEditDTO: SpendoEditDTO): Promise<void> => {
  try {
    const response = await api.post('/spendo/spendoEdit', spendoEditDTO);
    console.log('가계부 항목 수정 성공:', response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('가계부 항목 수정 실패 (응답 코드:', error.response.status, '):', error.response.data);
    } else {
      console.error('가계부 항목 수정 실패:', error);
    }
    throw error;
  }
};


// 가계부 항목 삭제 API 통신
export const deleteSpendoItem = async (spendoNo: number): Promise<void> => {
  try {
    const response = await api.post('/spendo/spendoDel', null, {
      params: { spendoNo },
    });
    console.log('가계부 항목 삭제 성공:', response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('가계부 항목 삭제 실패 (응답 코드:', error.response.status, '):', error.response.data);
    } else {
      console.error('가계부 항목 삭제 실패:', error);
    }
    throw error;
  }
};

// 가격을 세 자리마다 쉼표로 포맷팅하는 함수
const formatPrice = (price: number): string => {
  return price.toLocaleString('ko-KR');
};

// 화면 크기에 따른 반응형 스타일 상수
const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 414;
const isLargeScreen = width >= 414;

// 메인 검색 조건 컴포넌트
const SearchCriteria: FC = () => {
  // 상태 관리
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [spendoTitle, setSpendoTitle] = useState('');
  const [commonCodes, setCommonCodes] = useState<CommonCodeType[]>([]);
  const [commonCardTypes, setCommonCardTypes] = useState<CommonCodeType[]>([]);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isLoadingCodes, setIsLoadingCodes] = useState(true);
  const [selectedSpendoType, setSpendoType] = useState('ALL');
  const [selectedCardType, setCardType] = useState('ALL');

  // 가계부 내역 목록 상태
  const [spendoList, setSpendoList] = useState<SpendoItemType[]>([]);

  // ⭐️ 모달 상태 관리 변수
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SpendoItemType | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // ⭐️ 수정 모달의 입력 필드 상태
  const [editSpendoNo, setEditSpendoNo] = useState<number>(0);
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editSpendoType, setEditSpendoType] = useState('');
  const [editCardType, setEditCardType] = useState('');
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);


  // 테이블 행 클릭 핸들러 (상세 정보 API 호출 포함)
  const handleItemClick = async (item: SpendoItemType) => {
    setIsLoadingDetails(true);
    setIsDetailsModalVisible(true);
    try {
      const details = await getSpendoDetails(item.spendoNo);
      setSelectedItem(details);
    } catch (error) {
      Alert.alert('오류', '상세 정보를 불러오는 데 실패했습니다.');
      handleCloseDetailsModal();
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // 상세 모달 닫기 핸들러
  const handleCloseDetailsModal = () => {
    setIsDetailsModalVisible(false);
    setSelectedItem(null);
  };
  
  // ⭐️ 수정 버튼 클릭 핸들러
  const handleEdit = async (item: SpendoItemType) => {
    // 상세 정보를 불러와서 모달에 채움
    try {
      const details = await getSpendoDetails(item.spendoNo);
      setEditSpendoNo(details.spendoNo);
      setEditDate(new Date(details.spendoDate));
      setEditTitle(details.spendoTitle);
      setEditContent(details.spendoContent);
      setEditPrice(String(details.spendoPrice));
      setEditSpendoType(details.spendoType);
      setEditCardType(details.spendoCodeType);
      setIsEditModalVisible(true);
    } catch (error) {
      Alert.alert('오류', '수정할 항목의 상세 정보를 불러오는 데 실패했습니다.');
    }
  };

  // ⭐️ 수정 모달 닫기 핸들러
  const handleCloseEditModal = () => {
    setIsEditModalVisible(false);
    setEditSpendoNo(0);
    setEditDate(new Date());
    setEditTitle('');
    setEditContent('');
    setEditPrice('');
    setEditSpendoType('');
    setEditCardType('');
  };
  
  // ⭐️ 수정 내용 저장 핸들러
  const handleSaveEdit = async () => {
    if (!editTitle || !editPrice) {
      Alert.alert('알림', '제목과 가격을 입력해주세요.');
      return;
    }
  
    const updatedItem: SpendoEditDTO = {
      spendoNo: editSpendoNo,
      spendoDate: formatDate(editDate),
      spendoTitle: editTitle,
      spendoPrice: Number(editPrice.replace(/,/g, '')),
      spendoContent: editContent,
      spendoType: editSpendoType,
      spendoCodeType: editCardType,
    };
  
    try {
      await updateSpendoItem(updatedItem);
      Alert.alert('성공', '항목이 성공적으로 수정되었습니다.');
      handleCloseEditModal();
      handleSearch(); // 목록 새로고침
    } catch (error) {
      Alert.alert('오류', '항목 수정에 실패했습니다.');
    }
  };


  // 삭제 버튼 클릭 핸들러
  const handleDelete = (spendoNo: number) => {
    Alert.alert(
      '삭제 확인',
      '정말로 이 항목을 삭제하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          onPress: async () => {
            try {
              await deleteSpendoItem(spendoNo);
              Alert.alert('성공', '항목이 삭제되었습니다.');
              handleSearch();
            } catch (error) {
              Alert.alert('오류', '항목 삭제에 실패했습니다.');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  // 가계부 내역 목록을 API에서 가져오는 함수
  const fetchSpendoList = async (criteria: SpendoListData) => {
    try {
      const list = await getSpendoListByDate(criteria);
      setSpendoList(list);
    } catch (error) {
      Alert.alert('오류', '가계부 내역을 불러오는 데 실패했습니다.');
      setSpendoList([]);
    }
  };

  // 컴포넌트 마운트 시 공통 코드 및 초기 가계부 목록 가져오기
  useEffect(() => {
    const fetchAllCommonCodes = async () => {
      setIsLoadingCodes(true);
      try {
        const spendoCodes = await getCommonCodes();
        const cardCodes = await getCommonCardTypeCodes();

        setCommonCodes(spendoCodes);
        setCommonCardTypes(cardCodes);

        if (spendoCodes.length > 0) {
          setSpendoType('ALL');
        }
        if (cardCodes.length > 0) {
          setCardType('ALL');
        }
      } catch (error) {
        Alert.alert('오류', '공통 코드를 불러오는 데 실패했습니다.');
      } finally {
        setIsLoadingCodes(false);
      }
    };

    fetchAllCommonCodes();

    const defaultCriteria = {
      startDt: formatDate(new Date()),
      endDt: formatDate(new Date()),
      spendoTitle: '',
      spendoType: 'ALL',
      spendoCodeType: 'ALL',
    };
    fetchSpendoList(defaultCriteria);
  }, []);

  // 지출/수입 라디오 버튼 데이터 최적화
  const radioButtonsData = useMemo(() => {
    const radioItemStyle = { flexGrow: 1 };
    const allOption = { id: 'ALL', label: '전체', value: 'ALL', containerStyle: radioItemStyle };
    const apiOptions = commonCodes.map((code) => ({
      id: String(code.commonCode),
      label: String(code.commonName),
      value: String(code.commonCode),
      containerStyle: radioItemStyle,
    }));
    return [allOption, ...apiOptions];
  }, [commonCodes]);

  // 카드 종류 라디오 버튼 데이터 최적화
  const cardRadioButtonsData = useMemo(() => {
    const radioItemStyle = { flexGrow: 1 };
    const allOption = { id: 'ALL', label: '전체', value: 'ALL', containerStyle: radioItemStyle };
    const apiOptions = commonCardTypes.map((code) => ({
      id: String(code.commonCode),
      label: String(code.commonName),
      value: String(code.commonCode),
      containerStyle: radioItemStyle,
    }));
    return [allOption, ...apiOptions];
  }, [commonCardTypes]);

  // 날짜 포맷팅 함수
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 날짜 변경 핸들러
  const onChangeStartDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(Platform.OS === 'ios');
    setStartDate(currentDate);
  };

  const onChangeEndDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(Platform.OS === 'ios');
    setEndDate(currentDate);
  };
  
  // 수정 모달 날짜 변경 핸들러
  const onChangeEditDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || editDate;
    setShowEditDatePicker(Platform.OS === 'ios');
    setEditDate(currentDate);
  };

  // 검색 버튼 클릭 핸들러
  const handleSearch = async () => {
    const searchCriteria = {
      startDt: formatDate(startDate),
      endDt: formatDate(endDate),
      spendoTitle: spendoTitle || '',
      spendoType: selectedSpendoType === 'ALL' ? '' : selectedSpendoType,
      spendoCodeType: selectedCardType === 'ALL' ? '' : selectedCardType,
    };
    fetchSpendoList(searchCriteria);
  };

  return (
    // ⭐️ 모든 컴포넌트를 <>로 감싸주세요.
    <> 
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>검색 조건</Text>
        <View style={styles.searchSection}>
          <Text style={styles.label}>날짜</Text>
          <View style={styles.dateRangeContainer}>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowStartDatePicker(true)}>
              <Text style={styles.dateText}>{formatDate(startDate)}</Text>
            </TouchableOpacity>
            <Text style={styles.dateSeparator}>~</Text>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowEndDatePicker(true)}>
              <Text style={styles.dateText}>{formatDate(endDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={onChangeStartDate}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={onChangeEndDate}
          />
        )}

        <View style={styles.searchSection}>
          <Text style={styles.label}>제목</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="검색할 제목을 입력하세요"
            onChangeText={setSpendoTitle}
            value={spendoTitle}
            placeholderTextColor="#999"
          />
        </View>
        <View style={styles.searchSection}>
          <Text style={styles.label}>지출/수입</Text>
          {isLoadingCodes ? (
            <ActivityIndicator size="large" color="#0000ff" style={{ marginVertical: 10 }} />
          ) : (
            <View style={styles.radioGroupContainer}>
              <RadioGroup
                radioButtons={radioButtonsData}
                onPress={(id) => setSpendoType(id)}
                selectedId={selectedSpendoType}
                layout="row"
                containerStyle={styles.radioGroup}
              />
            </View>
          )}
        </View>

        <View style={styles.searchSection}>
          <Text style={styles.label}>카드 종류</Text>
          {isLoadingCodes ? (
            <ActivityIndicator size="large" color="#0000ff" style={{ marginVertical: 10 }} />
          ) : (
            <View style={styles.radioGroupContainer}>
              <RadioGroup
                radioButtons={cardRadioButtonsData}
                onPress={(id) => setCardType(id)}
                selectedId={selectedCardType}
                layout="row"
                containerStyle={styles.radioGroup}
              />
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>검색</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>날짜</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>제목</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>지출/수입</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>가격</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>카드</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}></Text>
        </View>
        <ScrollView style={styles.tableBody}>
          {spendoList.length > 0 ? (
            spendoList.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tableRow}
                onPress={() => handleItemClick(item)}
              >
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.spendoDate}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.spendoTitle}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.spendoType}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{formatPrice(item.spendoPrice)}원</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.spendoCodeType}</Text>
                <View style={[styles.actionButtonsContainer, { flex: 2 }]}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEdit(item)}
                  >
                    <Text style={styles.actionButtonText}>수정</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(item.spendoNo)}
                  >
                    <Text style={styles.actionButtonText}>삭제</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>검색된 내역이 없습니다.</Text>
            </View>
          )}
        </ScrollView>
      </View>
  
      {/* ⭐️ 상세 보기 모달: 기존 모달을 상세 보기 전용으로 분리 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isDetailsModalVisible}
        onRequestClose={handleCloseDetailsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>거래 내역 상세</Text>
            {isLoadingDetails ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : (
              selectedItem && (
                <View style={styles.modalDetails}>
                  <Text style={styles.modalDetailText}>번호: {selectedItem.spendoNo}</Text>
                  <Text style={styles.modalDetailText}>날짜: {selectedItem.spendoDate}</Text>
                  <Text style={styles.modalDetailText}>제목: {selectedItem.spendoTitle}</Text>
                  <Text style={styles.modalDetailText}>내용: {selectedItem.spendoContent}</Text>
                  <Text style={styles.modalDetailText}>지출/수입: {selectedItem.spendoType}</Text>
                  <Text style={styles.modalDetailText}>가격: {formatPrice(selectedItem.spendoPrice)}원</Text>
                  <Text style={styles.modalDetailText}>카드: {selectedItem.spendoCodeType}</Text>
                </View>
              )
            )}
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseDetailsModal}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ⭐️ 수정 모달: 새로운 수정 전용 모달 추가 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={handleCloseEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>거래 내역 수정</Text>
            <ScrollView>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>제목</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editTitle}
                  onChangeText={setEditTitle}
                />
              </View>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>내용</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editContent}
                  onChangeText={setEditContent}
                />
              </View>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>가격</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editPrice}
                  onChangeText={(text) => setEditPrice(text.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>날짜</Text>
                <TouchableOpacity style={styles.modalInput} onPress={() => setShowEditDatePicker(true)}>
                  <Text>{formatDate(editDate)}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>지출/수입</Text>
                <RadioGroup
                  radioButtons={radioButtonsData.filter(btn => btn.id !== 'ALL')} // 전체 옵션 제외
                  onPress={(id) => setEditSpendoType(id)}
                  selectedId={editSpendoType}
                  layout="row"
                  containerStyle={styles.radioGroup}
                />
              </View>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>카드 종류</Text>
                <RadioGroup
                  radioButtons={cardRadioButtonsData.filter(btn => btn.id !== 'ALL')} // 전체 옵션 제외
                  onPress={(id) => setEditCardType(id)}
                  selectedId={editCardType}
                  layout="row"
                  containerStyle={styles.radioGroup}
                />
              </View>
            </ScrollView>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveEdit}>
                <Text style={styles.modalButtonText}>저장</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleCloseEditModal}>
                <Text style={styles.modalButtonText}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showEditDatePicker && (
          <DateTimePicker
            value={editDate}
            mode="date"
            display="default"
            onChange={onChangeEditDate}
          />
        )}
    </>
  );
};

// 컴포넌트 스타일 정의
const styles = StyleSheet.create({
  container: {
    padding: isSmallScreen ? 15 : 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  sectionTitle: {
    fontSize: isLargeScreen ? 20 : isMediumScreen ? 18 : 16,
    fontWeight: 'bold',
    marginBottom: isSmallScreen ? 10 : 15,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 10 : 15,
  },
  label: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: 'bold',
    marginRight: 10,
    minWidth: isLargeScreen ? 75 : isMediumScreen ? 70 : 65,
  },
  dateRangeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: isSmallScreen ? 8 : 10,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  dateText: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#333',
  },
  dateSeparator: {
    fontSize: 16,
    marginHorizontal: 10,
    color: '#666',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: isSmallScreen ? 8 : 10,
    fontSize: isSmallScreen ? 14 : 16,
  },
  searchButton: {
    backgroundColor: '#007aff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: 'bold',
  },
  radioGroupContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  radioGroup: {
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tableContainer: {
    padding: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 10,
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    fontSize: isSmallScreen ? 12 : 14,
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  tableBody: {
    marginTop: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 10,
  },
  tableCell: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#555',
    textAlign: 'center',
    flex: 1,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDataText: {
    color: '#888',
    fontSize: 16,
  },
  // 모달 관련 스타일
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalDetails: {
    marginBottom: 20,
  },
  modalDetailText: {
    fontSize: 16,
    marginBottom: 5,
  },
  closeButton: {
    backgroundColor: '#007aff',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // 액션 버튼 관련 스타일
  actionButtonsContainer: {
    flex: 2, 
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  actionButton: {
    paddingVertical: 4, 
    paddingHorizontal: 6, 
    borderRadius: 5,
    flex: 1, 
    marginHorizontal: 2,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: isSmallScreen ? 9 : 11,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#3498db',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  
  // ⭐️ 수정 모달에 필요한 새로운 스타일
  modalInputGroup: {
    marginBottom: 15,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: '#28a745',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SearchCriteria;