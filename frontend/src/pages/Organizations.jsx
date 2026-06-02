
import React from "react";
import{useEffect, useState} from "react";
import {useGetOrganizationByIdQuery} from "../features/organizations/organizationsApiSlice";
import { useParams } from "react-router-dom";

const Organizations = () => {
  const params = useParams();
  console.log(params);
  const { data, error, isLoading } = useGetOrganizationByIdQuery({ id: params.id, slug: params.slug });
  console.log("data ::", data);

  return <>
    <h3>
      Organizations
    </h3>
  </>
};

export default Organizations;
