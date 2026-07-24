package com.epms.repository;

import com.epms.entity.AccountStatus;
import com.epms.entity.PhotoStatus;
import com.epms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
    Boolean existsByPhone(String phone);
    Boolean existsByFirstNameIgnoreCaseAndLastNameIgnoreCase(String firstName, String lastName);
    List<User> findByAccountStatus(AccountStatus accountStatus);
    List<User> findByPhotoStatus(PhotoStatus photoStatus);
}
